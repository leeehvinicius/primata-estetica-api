import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTimeTrackingDto } from './dto/register-time-tracking.dto';
import { ValidateTimeTrackingDto } from './dto/validate-time-tracking.dto';
import { TimeTrackingQueryDto } from './dto/time-tracking-query.dto';
import { UpdateTimeTrackingSettingsDto } from './dto/time-tracking-settings.dto';
import {
  GenerateTimeTrackingReportDto,
  TimeTrackingReportQueryDto,
} from './dto/time-tracking-report.dto';
import {
  TimeTracking,
  TimeTrackingStatus,
  TimeTrackingType,
  ValidationAction,
  ReportStatus,
} from '@prisma/client';
import { Request } from 'express';
import { PhotoCaptureService } from './services/photo-capture.service';
import { LocationService } from './services/location.service';

@Injectable()
export class TimeTrackingService {
  constructor(
    private prisma: PrismaService,
    private photoCaptureService: PhotoCaptureService,
    private locationService: LocationService,
  ) {}

  async registerTimeTracking(
    registerDto: RegisterTimeTrackingDto,
    userId: string,
    request: Request,
  ): Promise<TimeTracking> {
    // Buscar usuário logado
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.profile) {
      throw new BadRequestException('Perfil do usuário não encontrado');
    }

    // Verificar se já existe um registro recente do mesmo tipo
    const recentRecord = await this.prisma.timeTracking.findFirst({
      where: {
        userId: user.id,
        type: registerDto.type,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
        },
      },
    });

    if (recentRecord) {
      throw new BadRequestException('Já existe um registro recente deste tipo');
    }

    // Validar horário de registro considerando atendimentos
    const currentTime = new Date();
    await this.validateWorkingHoursWithAppointments(
      currentTime,
      user.id,
      user.email,
    );

    // Validar localização se fornecida
    if (registerDto.location) {
      await this.validateLocation(registerDto.location, user.id);
    }

    // Processar foto se fornecida
    let photoUrl = registerDto.photoUrl;
    if (registerDto.photoData) {
      photoUrl = await this.photoCaptureService.processPhoto(
        registerDto.photoData,
        user.id,
      );
    }

    // Criar registro de ponto
    const timeTracking = await this.prisma.timeTracking.create({
      data: {
        userId: user.id,
        cpf: user.profile.document || '', // Usar CPF do perfil do usuário
        photoUrl,
        photoData: registerDto.photoData,
        latitude: registerDto.location?.latitude,
        longitude: registerDto.location?.longitude,
        address: registerDto.location?.address,
        city: registerDto.location?.city,
        state: registerDto.location?.state,
        country: registerDto.location?.country,
        accuracy: registerDto.location?.accuracy,
        type: registerDto.type,
        status: TimeTrackingStatus.PENDING,
        deviceInfo: registerDto.deviceInfo as any,
        ipAddress: request.ip || request.connection.remoteAddress,
        userAgent: request.get('User-Agent'),
        notes: registerDto.notes,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return timeTracking;
  }

  async getTimeTrackings(
    query: TimeTrackingQueryDto,
    userId: string,
  ): Promise<{
    data: TimeTracking[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 500,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      ...filters
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Verificar se userId é válido
    if (!userId) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }

    // Se não for admin, só pode ver seus próprios registros
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user?.profile?.role !== 'ADMINISTRADOR') {
      where.userId = userId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.cpf) {
      where.cpf = filters.cpf;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.timeTracking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          validator: {
            include: {
              profile: true,
            },
          },
        },
      }),
      this.prisma.timeTracking.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getTimeTrackingById(id: string, userId: string): Promise<TimeTracking> {
    const timeTracking = await this.prisma.timeTracking.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        validator: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!timeTracking) {
      throw new NotFoundException('Registro de ponto não encontrado');
    }

    // Verificar permissão
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (
      user?.profile?.role !== 'ADMINISTRADOR' &&
      timeTracking.userId !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este registro',
      );
    }

    return timeTracking;
  }

  async validateTimeTracking(
    validateDto: ValidateTimeTrackingDto,
    validatorId: string,
  ): Promise<TimeTracking> {
    const timeTracking = await this.prisma.timeTracking.findUnique({
      where: { id: validateDto.timeTrackingId },
    });

    if (!timeTracking) {
      throw new NotFoundException('Registro de ponto não encontrado');
    }

    // Verificar se o usuário tem permissão para validar
    const validator = await this.prisma.user.findUnique({
      where: { id: validatorId },
      include: { profile: true },
    });

    if (
      !validator ||
      !['ADMINISTRADOR', 'MEDICO'].includes(validator.profile?.role || '')
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para validar registros de ponto',
      );
    }

    const updateData: any = {
      validatedAt: new Date(),
      validatedBy: validatorId,
    };

    if (validateDto.action === ValidationAction.APPROVE) {
      updateData.status = TimeTrackingStatus.APPROVED;
    } else if (validateDto.action === ValidationAction.REJECT) {
      updateData.status = TimeTrackingStatus.REJECTED;
      updateData.rejectionReason = validateDto.reason;
    } else if (validateDto.action === ValidationAction.REQUEST_INFO) {
      updateData.status = TimeTrackingStatus.UNDER_REVIEW;
    }

    const updatedTimeTracking = await this.prisma.timeTracking.update({
      where: { id: validateDto.timeTrackingId },
      data: updateData,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        validator: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Criar registro de validação
    await this.prisma.timeTrackingValidation.create({
      data: {
        timeTrackingId: validateDto.timeTrackingId,
        validatorId,
        action: validateDto.action,
        reason: validateDto.reason,
        additionalInfo: validateDto.additionalInfo,
      },
    });

    return updatedTimeTracking;
  }

  async updateTimeTrackingSettings(
    userId: string,
    settingsDto: UpdateTimeTrackingSettingsDto,
  ) {
    return this.prisma.timeTrackingSettings.upsert({
      where: { userId },
      update: settingsDto,
      create: {
        userId,
        ...settingsDto,
      },
    });
  }

  async getTimeTrackingSettings(userId: string) {
    return this.prisma.timeTrackingSettings.findUnique({
      where: { userId },
    });
  }

  async generateTimeTrackingReport(
    reportDto: GenerateTimeTrackingReportDto,
    generatorId: string,
  ) {
    const { userId, periodStart, periodEnd, notes } = reportDto;

    // Buscar todos os registros de ponto do período
    const timeTrackings = await this.prisma.timeTracking.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd),
        },
        status: TimeTrackingStatus.APPROVED,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calcular horas trabalhadas
    const report = this.calculateWorkingHours(timeTrackings);

    return this.prisma.timeTrackingReport.create({
      data: {
        userId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalHours: report.totalHours,
        regularHours: report.regularHours,
        overtimeHours: report.overtimeHours,
        breakHours: report.breakHours,
        daysWorked: report.daysWorked,
        daysAbsent: report.daysAbsent,
        status: ReportStatus.PENDING,
        generatedBy: generatorId,
        notes,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        generator: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async getTimeTrackingReports(
    query: TimeTrackingReportQueryDto,
    userId: string,
  ) {
    const where: any = {};

    // Se não for admin, só pode ver seus próprios relatórios
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (user?.profile?.role !== 'ADMINISTRADOR') {
      where.userId = userId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.periodStart = {};
      if (query.startDate) {
        where.periodStart.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.periodStart.lte = new Date(query.endDate);
      }
    }

    return this.prisma.timeTrackingReport.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        generator: {
          include: {
            profile: true,
          },
        },
        approver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async validateLocation(location: any, userId: string): Promise<void> {
    // Validar coordenadas
    if (
      !this.locationService.validateCoordinates(
        location.latitude,
        location.longitude,
      )
    ) {
      throw new BadRequestException('Coordenadas inválidas');
    }

    // Validar precisão
    if (
      location.accuracy &&
      !this.locationService.validateAccuracy(location.accuracy)
    ) {
      throw new BadRequestException('Precisão da localização muito baixa');
    }

    // Detectar localização suspeita
    if (this.locationService.detectSuspiciousLocation(location)) {
      throw new BadRequestException('Localização suspeita detectada');
    }

    // Buscar configurações do usuário
    const settings = await this.prisma.timeTrackingSettings.findUnique({
      where: { userId },
    });

    if (!settings?.requireLocation) return;

    // Verificar se a localização está dentro dos locais permitidos
    if (settings.allowedLocations) {
      const allowedLocations = settings.allowedLocations as any[];
      if (!this.locationService.validateLocation(location, allowedLocations)) {
        throw new BadRequestException('Localização fora dos locais permitidos');
      }
    }
  }

  /**
   * Valida o horário de registro considerando atendimentos agendados
   * Se não houver atendimento registrado, compara com horário padrão
   * Se houver atendimento agendado até 20:00, permite registro e contabiliza hora extra
   */
  private async validateWorkingHoursWithAppointments(
    timestamp: Date,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    // Buscar configurações do usuário para obter horário padrão
    const settings = await this.prisma.timeTrackingSettings.findUnique({
      where: { userId },
    });

    // Definir horário padrão (padrão: 08:00 às 18:00)
    const defaultStartTime = '08:00';
    const defaultEndTime = '18:00';
    const workingHours = settings?.workingHours as any;
    const standardStartTime = workingHours?.startTime || defaultStartTime;
    const standardEndTime = workingHours?.endTime || defaultEndTime;

    // Obter data atual (apenas data, sem hora)
    const currentDate = new Date(timestamp);
    currentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Buscar profissional associado ao usuário (se existir)
    const professional = await this.prisma.professional.findFirst({
      where: {
        email: userEmail,
        isActive: true,
      },
    });

    // Buscar atendimentos do dia atual onde o usuário está envolvido
    // 1. Atendimentos onde o usuário é o profissional
    // 2. Atendimentos criados pelo usuário
    const orConditions: any[] = [];

    if (professional) {
      orConditions.push({
        professionalId: professional.id,
      });
    }

    orConditions.push({
      createdBy: userId,
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        OR: orConditions,
        scheduledDate: {
          gte: currentDate,
          lt: nextDay,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    // Se não houver atendimento registrado, comparar com horário padrão
    if (appointments.length === 0) {
      const currentHour = timestamp.getHours();
      const currentMinute = timestamp.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMin] = standardStartTime.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMin;

      // Se estiver antes do horário padrão de início, lançar exceção
      if (currentTimeInMinutes < startTimeInMinutes) {
        throw new BadRequestException(
          `Registro de ponto antes do horário padrão de atendimento (${standardStartTime})`,
        );
      }

      // Permitir registro se estiver dentro ou após o horário padrão
      // Horas extras serão calculadas posteriormente no cálculo de horas trabalhadas
      // se o registro for após o horário padrão de término
      return;
    }

    // Se houver atendimento agendado, verificar se algum é até 20:00
    const hasAppointmentUntil20 = appointments.some((appointment) => {
      const [endHour, endMin] = appointment.endTime.split(':').map(Number);
      const appointmentEndTimeInMinutes = endHour * 60 + endMin;
      const limit20InMinutes = 20 * 60; // 20:00 em minutos

      return appointmentEndTimeInMinutes <= limit20InMinutes;
    });

    if (hasAppointmentUntil20) {
      // Se houver atendimento até 20:00, considerar horário válido
      // O registro será permitido e a hora extra será contabilizada no cálculo
      return;
    }

    // Se houver atendimento após 20:00, ainda permitir mas será tratado como hora extra
    // A validação básica já foi feita, então permitimos o registro
  }

  private calculateWorkingHours(timeTrackings: TimeTracking[]): {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    breakHours: number;
    daysWorked: number;
    daysAbsent: number;
  } {
    // Implementar cálculo de horas trabalhadas
    // Por enquanto, retorna valores mock
    return {
      totalHours: 8.0,
      regularHours: 8.0,
      overtimeHours: 0.0,
      breakHours: 1.0,
      daysWorked: 1,
      daysAbsent: 0,
    };
  }
}
