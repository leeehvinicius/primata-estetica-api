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
  Prisma,
  TimeTrackingStatus,
  TimeTrackingType,
  ValidationAction,
  ReportStatus,
} from '@prisma/client';
import { Request } from 'express';
import { PhotoCaptureService } from './services/photo-capture.service';
import { LocationService } from './services/location.service';

type TimeTrackingWithUser = Prisma.TimeTrackingGetPayload<{
  include: { user: { select: { id: true; name: true } } };
}>;

export interface DailyByUserGroup {
  date: string;
  userId: string;
  userName: string;
  cpf?: string;
  records: Array<{
    id: string;
    type: TimeTrackingType;
    status: TimeTrackingStatus;
    timestamp: Date;
  }>;
}

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
    // Buscar usuÃ¡rio logado
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('UsuÃ¡rio nÃ£o encontrado');
    }

    if (!user.profile) {
      throw new BadRequestException('Perfil do usuÃ¡rio nÃ£o encontrado');
    }

    // Verificar se jÃ¡ existe um registro recente do mesmo tipo
    const recentRecord = await this.prisma.timeTracking.findFirst({
      where: {
        userId: user.id,
        type: registerDto.type,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Ãšltimos 5 minutos
        },
      },
    });

    if (recentRecord) {
      throw new BadRequestException('JÃ¡ existe um registro recente deste tipo');
    }

    // Validar horÃ¡rio de registro considerando atendimentos
    const currentTime = new Date();
    await this.validateWorkingHoursWithAppointments(
      currentTime,
      user.id,
      user.email,
    );

    // Validar localizaÃ§Ã£o se fornecida
    if (registerDto.location) {
      await this.validateLocation(registerDto.location, user.id);
    }

    // Processar foto se fornecida
    let photoUrl = registerDto.photoUrl;
    if (registerDto.photoData) {
      photoUrl = await this.photoCaptureService.processPhoto(
        registerDto.photoData,
        user.id,
        request,
      );
    }

    // Criar registro de ponto
    const timeTracking = await this.prisma.timeTracking.create({
      data: {
        userId: user.id,
        cpf: user.profile.document || '', // Usar CPF do perfil do usuÃ¡rio
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
    const { page = 1, limit = 500, sortBy = 'timestamp', sortOrder = 'desc' } =
      query;
    const skip = (page - 1) * limit;
    const where = await this.buildTimeTrackingWhere(query, userId);

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

  async getDailyByUser(
    query: TimeTrackingQueryDto,
    userId: string,
  ): Promise<{
    data: DailyByUserGroup[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 50, sortOrder = 'desc' } = query;
    const where = await this.buildTimeTrackingWhere(query, userId);

    const records = (await this.prisma.timeTracking.findMany({
      where,
      orderBy: { timestamp: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as TimeTrackingWithUser[];

    const grouped = new Map<string, DailyByUserGroup>();

    for (const record of records) {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      const key = `${record.userId}::${dateKey}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          date: dateKey,
          userId: record.userId,
          userName: record.user?.name || 'Sem nome',
          cpf: record.cpf || undefined,
          records: [
            {
              id: record.id,
              type: record.type,
              status: record.status,
              timestamp: record.timestamp,
            },
          ],
        });
        continue;
      }

      existing.records.push({
        id: record.id,
        type: record.type,
        status: record.status,
        timestamp: record.timestamp,
      });
    }

    const items = Array.from(grouped.values())
      .map((group) => ({
        ...group,
        records: group.records.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        ),
      }))
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) {
          return sortOrder === 'asc' ? dateCompare : -dateCompare;
        }
        return a.userName.localeCompare(b.userName, 'pt-BR');
      });

    const skip = (page - 1) * limit;
    const paginated = items.slice(skip, skip + limit);

    return {
      data: paginated,
      total: items.length,
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
      throw new NotFoundException('Registro de ponto nÃ£o encontrado');
    }

    // Verificar permissÃ£o
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (
      user?.profile?.role !== 'ADMINISTRADOR' &&
      timeTracking.userId !== userId
    ) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para visualizar este registro',
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
      throw new NotFoundException('Registro de ponto nÃ£o encontrado');
    }

    // Verificar se o usuÃ¡rio tem permissÃ£o para validar
    const validator = await this.prisma.user.findUnique({
      where: { id: validatorId },
      include: { profile: true },
    });

    if (
      !validator ||
      !['ADMINISTRADOR', 'MEDICO'].includes(validator.profile?.role || '')
    ) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para validar registros de ponto',
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

    // Criar registro de validaÃ§Ã£o
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

    // Buscar todos os registros de ponto do perÃ­odo
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

    // Se nÃ£o for admin, sÃ³ pode ver seus prÃ³prios relatÃ³rios
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

  private async buildTimeTrackingWhere(
    query: TimeTrackingQueryDto,
    currentUserId: string,
  ): Promise<Prisma.TimeTrackingWhereInput> {
    const where: Prisma.TimeTrackingWhereInput = {};

    if (!currentUserId) {
      throw new BadRequestException('ID do usuario e obrigatorio');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { profile: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const isAdmin = currentUser.profile?.role === 'ADMINISTRADOR';

    if (!isAdmin) {
      where.userId = currentUserId;
    }

    if (query.userId) {
      if (!isAdmin && query.userId !== currentUserId) {
        throw new ForbiddenException(
          'Voce nao tem permissao para filtrar por outro funcionario',
        );
      }
      where.userId = query.userId;
    }

    if (query.cpf) {
      where.cpf = query.cpf;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      const timestampFilter: Prisma.DateTimeFilter = {};
      const startDate = this.parseFilterDate(query.startDate, false);
      const endDate = this.parseFilterDate(query.endDate, true);

      if (startDate) {
        timestampFilter.gte = startDate;
      }

      if (endDate) {
        timestampFilter.lte = endDate;
      }

      where.timestamp = timestampFilter;
    }

    return where;
  }

  private parseFilterDate(
    value?: string,
    isEndOfDay = false,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    if (!value.includes('T')) {
      if (isEndOfDay) {
        parsed.setHours(23, 59, 59, 999);
      } else {
        parsed.setHours(0, 0, 0, 0);
      }
    }

    return parsed;
  }

  private async validateLocation(location: any, userId: string): Promise<void> {
    // Validar coordenadas
    if (
      !this.locationService.validateCoordinates(
        location.latitude,
        location.longitude,
      )
    ) {
      throw new BadRequestException('Coordenadas invÃ¡lidas');
    }

    // Validar precisÃ£o
    if (
      location.accuracy &&
      !this.locationService.validateAccuracy(location.accuracy)
    ) {
      throw new BadRequestException('PrecisÃ£o da localizaÃ§Ã£o muito baixa');
    }

    // Detectar localizaÃ§Ã£o suspeita
    if (this.locationService.detectSuspiciousLocation(location)) {
      throw new BadRequestException('LocalizaÃ§Ã£o suspeita detectada');
    }

    // Buscar configuraÃ§Ãµes do usuÃ¡rio
    const settings = await this.prisma.timeTrackingSettings.findUnique({
      where: { userId },
    });

    if (!settings?.requireLocation) return;

    // Verificar se a localizaÃ§Ã£o estÃ¡ dentro dos locais permitidos
    if (settings.allowedLocations) {
      const allowedLocations = settings.allowedLocations as any[];
      if (!this.locationService.validateLocation(location, allowedLocations)) {
        throw new BadRequestException('LocalizaÃ§Ã£o fora dos locais permitidos');
      }
    }
  }

  /**
   * Valida o horÃ¡rio de registro considerando atendimentos agendados
   * Se nÃ£o houver atendimento registrado, compara com horÃ¡rio padrÃ£o
   * Se houver atendimento agendado atÃ© 20:00, permite registro e contabiliza hora extra
   */
  private async validateWorkingHoursWithAppointments(
    timestamp: Date,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    // Buscar configuraÃ§Ãµes do usuÃ¡rio para obter horÃ¡rio padrÃ£o
    const settings = await this.prisma.timeTrackingSettings.findUnique({
      where: { userId },
    });

    // Definir horÃ¡rio padrÃ£o (padrÃ£o: 08:00 Ã s 18:00)
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

    // Buscar profissional associado ao usuÃ¡rio (se existir)
    const professional = await this.prisma.professional.findFirst({
      where: {
        email: userEmail,
        isActive: true,
      },
    });

    // Buscar atendimentos do dia atual onde o usuÃ¡rio estÃ¡ envolvido
    // 1. Atendimentos onde o usuÃ¡rio Ã© o profissional
    // 2. Atendimentos criados pelo usuÃ¡rio
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

    // Se nÃ£o houver atendimento registrado, comparar com horÃ¡rio padrÃ£o
    if (appointments.length === 0) {
      const currentHour = timestamp.getHours();
      const currentMinute = timestamp.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMin] = standardStartTime.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMin;

      // Se estiver antes do horÃ¡rio padrÃ£o de inÃ­cio, lanÃ§ar exceÃ§Ã£o
      if (currentTimeInMinutes < startTimeInMinutes) {
        throw new BadRequestException(
          `Registro de ponto antes do horÃ¡rio padrÃ£o de atendimento (${standardStartTime})`,
        );
      }

      // Permitir registro se estiver dentro ou apÃ³s o horÃ¡rio padrÃ£o
      // Horas extras serÃ£o calculadas posteriormente no cÃ¡lculo de horas trabalhadas
      // se o registro for apÃ³s o horÃ¡rio padrÃ£o de tÃ©rmino
      return;
    }

    // Se houver atendimento agendado, verificar se algum Ã© atÃ© 20:00
    const hasAppointmentUntil20 = appointments.some((appointment) => {
      const [endHour, endMin] = appointment.endTime.split(':').map(Number);
      const appointmentEndTimeInMinutes = endHour * 60 + endMin;
      const limit20InMinutes = 20 * 60; // 20:00 em minutos

      return appointmentEndTimeInMinutes <= limit20InMinutes;
    });

    if (hasAppointmentUntil20) {
      // Se houver atendimento atÃ© 20:00, considerar horÃ¡rio vÃ¡lido
      // O registro serÃ¡ permitido e a hora extra serÃ¡ contabilizada no cÃ¡lculo
      return;
    }

    // Se houver atendimento apÃ³s 20:00, ainda permitir mas serÃ¡ tratado como hora extra
    // A validaÃ§Ã£o bÃ¡sica jÃ¡ foi feita, entÃ£o permitimos o registro
  }

  private calculateWorkingHours(timeTrackings: TimeTracking[]): {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    breakHours: number;
    daysWorked: number;
    daysAbsent: number;
  } {
    // Implementar cÃ¡lculo de horas trabalhadas
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
