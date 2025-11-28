import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
// Parceiros: desconto simples configurado no parceiro
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { BaileysIntegrationService } from '../external-integration/services/baileys-integration.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private baileysService: BaileysIntegrationService,
  ) {}

  async create(dto: CreateAppointmentDto, userId: string) {
    // Se userId não foi fornecido, buscar um usuário admin padrão
    let createdBy = userId;
    if (!createdBy) {
      const adminUser = await (this.prisma as any).user.findFirst({
        where: {
          profile: { role: 'ADMINISTRADOR' },
        },
      });
      if (adminUser) {
        createdBy = adminUser.id;
      } else {
        throw new ConflictException(
          'Usuário não encontrado para criar o agendamento',
        );
      }
    }

    // Verificar se o cliente existe
    const client = await (this.prisma as any).client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se o serviço existe
    const service = await (this.prisma as any).service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Verificar se o profissional existe (se fornecido)
    if (dto.professionalId) {
      const professional = await (this.prisma as any).professional.findUnique({
        where: { id: dto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException('Profissional não encontrado');
      }
    }

    // Calcular horário de fim baseado na duração do serviço
    const startTime = new Date(`2000-01-01T${dto.startTime}:00`);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);
    const endTimeString = endTime.toTimeString().slice(0, 5);

    // Verificar disponibilidade
    const isAvailable = await this.checkAvailability(
      dto.scheduledDate,
      dto.startTime,
      endTimeString,
      dto.professionalId,
      dto.serviceId,
    );

    if (!isAvailable) {
      throw new ConflictException('Horário não disponível');
    }

    const appointmentData: any = {
      clientId: dto.clientId,
      serviceId: dto.serviceId,
      scheduledDate: new Date(dto.scheduledDate),
      startTime: dto.startTime,
      endTime: endTimeString,
      duration: service.duration,
      appointmentType: dto.appointmentType,
      priority: dto.priority || 'NORMAL',
      createdBy: createdBy,
    };

    if (dto.professionalId) {
      appointmentData.professionalId = dto.professionalId;
    }

    if (dto.partnerId) {
      appointmentData.partnerId = dto.partnerId;
    }

    if (dto.notes) {
      appointmentData.notes = dto.notes;
    }

    const appointment = await (this.prisma as any).appointment.create({
      data: appointmentData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            currentPrice: true,
            duration: true,
            color: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            document: true,
            partnerDiscount: true,
            clientDiscount: true,
            fixedDiscount: true,
          },
        },
      },
    });

    // Se houver parceiro informado, calcular desconto baseado nos percentuais/valor fixo do parceiro
    if (dto.partnerId) {
      try {
        const baseAmount = Number(appointment.service.currentPrice);
        const partner = await (this.prisma as any).partner.findFirst({
          where: { id: dto.partnerId, isActive: true },
        });
        if (partner) {
          const fixedDiscount = partner.fixedDiscount
            ? Number(partner.fixedDiscount)
            : 0;
          const percentageDiscount =
            ((Number(partner.partnerDiscount) +
              Number(partner.clientDiscount)) /
              100) *
            baseAmount;
          const discountAmount =
            fixedDiscount > 0
              ? Math.min(fixedDiscount, baseAmount)
              : percentageDiscount;
          appointment.pricing = {
            amount: baseAmount,
            partnerDiscountPercentage: Number(partner.partnerDiscount),
            clientDiscountPercentage: Number(partner.clientDiscount),
            fixedDiscountAmount: fixedDiscount,
            partnerDiscountAmount: discountAmount,
            finalAmount: Math.max(0, baseAmount - discountAmount),
            partnerId: dto.partnerId,
          };
        }
      } catch {}
    }

    // Criar lembretes automáticos
    await this.createAutomaticReminders(
      appointment.id,
      userId,
      dto.notificationChannels,
    );

    return appointment;
  }

  async findAll(query: ListAppointmentsDto) {
    const {
      page = 1,
      limit = 10,
      clientName,
      professionalName,
      appointmentType,
      status,
      priority,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
    } = query;
    const startDate = (query as any).startDate || (query as any).dateFrom;
    const endDate = (query as any).endDate || (query as any).dateTo;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (clientName) {
      where.client = {
        name: { contains: clientName, mode: 'insensitive' },
      };
    }

    if (professionalName) {
      where.professional = {
        name: { contains: professionalName, mode: 'insensitive' },
      };
    }

    if (appointmentType) {
      where.appointmentType = appointmentType;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    // Validar campo de ordenação
    const allowedSortFields = [
      'scheduledDate',
      'startTime',
      'status',
      'priority',
      'createdAt',
      'updatedAt',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'scheduledDate';

    // Construir ordenação
    const orderBy: any = {};
    orderBy[validSortBy] = sortOrder;

    const [appointments, total] = await Promise.all([
      (this.prisma as any).appointment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          professional: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              specialty: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              currentPrice: true,
              duration: true,
              color: true,
            },
          },
          partner: {
            select: {
              id: true,
              name: true,
              document: true,
              partnerDiscount: true,
              clientDiscount: true,
              fixedDiscount: true,
            },
          },
        },
      }),
      (this.prisma as any).appointment.count({ where }),
    ]);

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appt: any) => {
        try {
          // Garantir que os valores de desconto do partner sejam sempre retornados
          if (appt.partner) {
            // Fallback: se descontos não vieram no include, buscar rapidamente
            if (
              typeof appt.partner.partnerDiscount === 'undefined' ||
              typeof appt.partner.clientDiscount === 'undefined' ||
              typeof appt.partner.fixedDiscount === 'undefined'
            ) {
              const fullPartner = await (this.prisma as any).partner.findUnique(
                {
                  where: { id: appt.partner.id },
                  select: {
                    partnerDiscount: true,
                    clientDiscount: true,
                    fixedDiscount: true,
                  },
                },
              );
              if (fullPartner) {
                appt.partner = {
                  ...appt.partner,
                  partnerDiscount: fullPartner.partnerDiscount,
                  clientDiscount: fullPartner.clientDiscount,
                  fixedDiscount: fullPartner.fixedDiscount,
                };
              }
            }
          }

          // Calcular pricing se houver partner e service
          if (appt.partner && appt.service?.currentPrice) {
            const baseAmount = Number(appt.service.currentPrice);
            const fixedDiscount = appt.partner.fixedDiscount
              ? Number(appt.partner.fixedDiscount)
              : 0;
            const percentageDiscount =
              ((Number(appt.partner.partnerDiscount) +
                Number(appt.partner.clientDiscount)) /
                100) *
              baseAmount;
            const discountAmount =
              fixedDiscount > 0
                ? Math.min(fixedDiscount, baseAmount)
                : percentageDiscount;
            appt.pricing = {
              amount: baseAmount,
              partnerDiscountPercentage: Number(appt.partner.partnerDiscount),
              clientDiscountPercentage: Number(appt.partner.clientDiscount),
              fixedDiscountAmount: fixedDiscount,
              partnerDiscountAmount: discountAmount,
              finalAmount: Math.max(0, baseAmount - discountAmount),
              partnerId: appt.partner?.id,
            };
          }
        } catch {}
        return appt;
      }),
    );

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      appointments: enrichedAppointments,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  async findOne(id: string) {
    const appointment = await (this.prisma as any).appointment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            currentPrice: true,
            duration: true,
            color: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            document: true,
            partnerDiscount: true,
            clientDiscount: true,
            fixedDiscount: true,
          },
        },
        reminders: {
          orderBy: { scheduledFor: 'asc' },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    try {
      // Garantir que os valores de desconto do partner sejam sempre retornados
      if (appointment.partner) {
        if (
          typeof appointment.partner.partnerDiscount === 'undefined' ||
          typeof appointment.partner.clientDiscount === 'undefined' ||
          typeof appointment.partner.fixedDiscount === 'undefined'
        ) {
          const fullPartner = await (this.prisma as any).partner.findUnique({
            where: { id: appointment.partner.id },
            select: {
              partnerDiscount: true,
              clientDiscount: true,
              fixedDiscount: true,
            },
          });
          if (fullPartner) {
            appointment.partner = {
              ...appointment.partner,
              partnerDiscount: fullPartner.partnerDiscount,
              clientDiscount: fullPartner.clientDiscount,
              fixedDiscount: fullPartner.fixedDiscount,
            };
          }
        }
      }

      // Calcular pricing se houver partner e service
      if (appointment.partner && appointment.service?.currentPrice) {
        const baseAmount = Number(appointment.service.currentPrice);
        const fixedDiscount = appointment.partner.fixedDiscount
          ? Number(appointment.partner.fixedDiscount)
          : 0;
        const percentageDiscount =
          ((Number(appointment.partner.partnerDiscount) +
            Number(appointment.partner.clientDiscount)) /
            100) *
          baseAmount;
        const discountAmount =
          fixedDiscount > 0
            ? Math.min(fixedDiscount, baseAmount)
            : percentageDiscount;
        appointment.pricing = {
          amount: baseAmount,
          partnerDiscountPercentage: Number(
            appointment.partner.partnerDiscount,
          ),
          clientDiscountPercentage: Number(appointment.partner.clientDiscount),
          fixedDiscountAmount: fixedDiscount,
          partnerDiscountAmount: discountAmount,
          finalAmount: Math.max(0, baseAmount - discountAmount),
          partnerId: appointment.partner?.id,
        };
      }
    } catch {}

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    // Verificar se o agendamento existe
    const existingAppointment = await (
      this.prisma as any
    ).appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se o profissional existe (se fornecido)
    if (dto.professionalId) {
      const professional = await (this.prisma as any).professional.findUnique({
        where: { id: dto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException('Profissional não encontrado');
      }
    }

    // Verificar se o serviço existe (se fornecido)
    if (dto.serviceId) {
      const service = await (this.prisma as any).service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) {
        throw new NotFoundException('Serviço não encontrado');
      }
    }

    const updateData: any = {};

    // Adicionar campos que foram fornecidos
    if (dto.professionalId !== undefined)
      updateData.professionalId = dto.professionalId;
    if (dto.serviceId !== undefined) updateData.serviceId = dto.serviceId;
    if (dto.scheduledDate !== undefined)
      updateData.scheduledDate = new Date(dto.scheduledDate);
    if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
    if (dto.partnerId !== undefined) updateData.partnerId = dto.partnerId;
    if (dto.appointmentType !== undefined)
      updateData.appointmentType = dto.appointmentType;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.cancellationReason !== undefined)
      updateData.cancellationReason = dto.cancellationReason;

    // Se mudou data/hora, recalcular horário de fim
    if (dto.scheduledDate || dto.startTime || dto.serviceId) {
      const service = dto.serviceId
        ? await (this.prisma as any).service.findUnique({
            where: { id: dto.serviceId },
          })
        : await (this.prisma as any).service.findUnique({
            where: { id: existingAppointment.serviceId },
          });

      const startTime = new Date(
        `2000-01-01T${dto.startTime || existingAppointment.startTime}:00`,
      );
      const endTime = new Date(startTime.getTime() + service.duration * 60000);
      updateData.endTime = endTime.toTimeString().slice(0, 5);
      updateData.duration = service.duration;
    }

    return (this.prisma as any).appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            currentPrice: true,
            duration: true,
            color: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Verificar se o agendamento existe
    const existingAppointment = await (
      this.prisma as any
    ).appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await (this.prisma as any).appointment.delete({ where: { id } });
    return { message: 'Agendamento deletado com sucesso' };
  }

  async cancel(id: string, reason: string) {
    const appointment = await (this.prisma as any).appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Agendamento já está cancelado');
    }

    return (this.prisma as any).appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });
  }

  async reschedule(id: string, newDate: string, newTime: string) {
    const appointment = await (this.prisma as any).appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException(
        'Não é possível remarcar um agendamento cancelado',
      );
    }

    // Verificar disponibilidade do novo horário
    const service = await (this.prisma as any).service.findUnique({
      where: { id: appointment.serviceId },
    });

    const startTime = new Date(`2000-01-01T${newTime}:00`);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);
    const endTimeString = endTime.toTimeString().slice(0, 5);

    const isAvailable = await this.checkAvailability(
      newDate,
      newTime,
      endTimeString,
      appointment.professionalId,
      appointment.serviceId,
      id, // Excluir o próprio agendamento da verificação
    );

    if (!isAvailable) {
      throw new ConflictException('Novo horário não disponível');
    }

    // Criar novo agendamento
    const newAppointment = await (this.prisma as any).appointment.create({
      data: {
        clientId: appointment.clientId,
        professionalId: appointment.professionalId,
        serviceId: appointment.serviceId,
        scheduledDate: new Date(newDate),
        startTime: newTime,
        endTime: endTimeString,
        duration: service.duration,
        appointmentType: appointment.appointmentType,
        priority: appointment.priority,
        notes: appointment.notes,
        rescheduledFrom: id,
        createdBy: appointment.createdBy,
      },
    });

    // Cancelar agendamento original
    await (this.prisma as any).appointment.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        cancellationReason: 'Remarcado para novo horário',
      },
    });

    return newAppointment;
  }

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, byStatus, byType, byPriority, today, thisWeek, thisMonth] =
      await Promise.all([
        (this.prisma as any).appointment.count(),
        (this.prisma as any).appointment.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        (this.prisma as any).appointment.groupBy({
          by: ['appointmentType'],
          _count: { appointmentType: true },
        }),
        (this.prisma as any).appointment.groupBy({
          by: ['priority'],
          _count: { priority: true },
        }),
        (this.prisma as any).appointment.count({
          where: { scheduledDate: { gte: startOfDay } },
        }),
        (this.prisma as any).appointment.count({
          where: { scheduledDate: { gte: startOfWeek } },
        }),
        (this.prisma as any).appointment.count({
          where: { scheduledDate: { gte: startOfMonth } },
        }),
      ]);

    const statusStats: any = {};
    byStatus.forEach((stat: any) => {
      statusStats[stat.status] = stat._count.status;
    });

    const typeStats: any = {};
    byType.forEach((stat: any) => {
      typeStats[stat.appointmentType] = stat._count.appointmentType;
    });

    const priorityStats: any = {};
    byPriority.forEach((stat: any) => {
      priorityStats[stat.priority] = stat._count.priority;
    });

    return {
      total,
      scheduled: statusStats.SCHEDULED || 0,
      confirmed: statusStats.CONFIRMED || 0,
      completed: statusStats.COMPLETED || 0,
      cancelled: statusStats.CANCELLED || 0,
      noShow: statusStats.NO_SHOW || 0,
      byType: typeStats,
      byStatus: statusStats,
      byPriority: priorityStats,
      today,
      thisWeek,
      thisMonth,
    };
  }

  async checkAvailability(
    date: string,
    startTime: string,
    endTime: string,
    professionalId?: string,
    serviceId?: string,
    excludeAppointmentId?: string,
  ) {
    const scheduledDate = new Date(date);
    const dayOfWeek = this.getDayOfWeek(scheduledDate);

    // Verificar se o profissional está disponível neste dia
    if (professionalId) {
      const professionalSchedule = await (
        this.prisma as any
      ).professionalSchedule.findFirst({
        where: {
          professionalId,
          dayOfWeek,
          isActive: true,
        },
      });

      if (!professionalSchedule) {
        return false; // Profissional não trabalha neste dia
      }

      // Verificar se o horário está dentro do horário de trabalho
      if (
        startTime < professionalSchedule.startTime ||
        endTime > professionalSchedule.endTime
      ) {
        return false;
      }
    }

    // Verificar conflitos de horário
    const conflictingAppointments = await (
      this.prisma as any
    ).appointment.findMany({
      where: {
        scheduledDate,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
        ...(professionalId && { professionalId }),
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
    });

    // permite até 30 agendamentos no mesmo horário
    const MAX_APPOINTMENTS_PER_SLOT = 30;

    return conflictingAppointments.length < MAX_APPOINTMENTS_PER_SLOT;
  }

  async getAvailableSlots(
    date: string,
    professionalId?: string,
    serviceId?: string,
  ) {
    const scheduledDate = new Date(date);
    const dayOfWeek = this.getDayOfWeek(scheduledDate);

    // Horários padrão de trabalho (8h às 18h)
    const workStart = '08:00';
    const workEnd = '18:00';
    const slotDuration = 30; // 30 minutos por slot

    const slots: string[] = [];
    const busySlots: string[] = [];

    // Gerar slots de 30 em 30 minutos
    const startTime = new Date(`2000-01-01T${workStart}:00`);
    const endTime = new Date(`2000-01-01T${workEnd}:00`);

    while (startTime < endTime) {
      const slotStart = startTime.toTimeString().slice(0, 5);
      const slotEnd = new Date(startTime.getTime() + slotDuration * 60000)
        .toTimeString()
        .slice(0, 5);

      // Verificar se o slot está disponível
      const isAvailable = await this.checkAvailability(
        date,
        slotStart,
        slotEnd,
        professionalId,
        serviceId,
      );

      if (isAvailable) {
        slots.push(slotStart);
      } else {
        busySlots.push(slotStart);
      }

      startTime.setMinutes(startTime.getMinutes() + slotDuration);
    }

    return {
      date,
      availableSlots: slots,
      busySlots,
      professionalId,
      serviceId,
    };
  }

  private async createAutomaticReminders(
    appointmentId: string,
    userId: string,
    channels?: string[],
  ) {
    // Se userId não foi fornecido, buscar um usuário admin padrão
    let createdBy = userId;
    if (!createdBy) {
      const adminUser = await (this.prisma as any).user.findFirst({
        where: {
          profile: { role: 'ADMINISTRADOR' },
        },
      });
      if (adminUser) {
        createdBy = adminUser.id;
      } else {
        throw new ConflictException(
          'Usuário não encontrado para criar os lembretes',
        );
      }
    }

    const appointment = await (this.prisma as any).appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
      },
    });

    const defaultChannels = channels || ['EMAIL', 'SMS'];
    const scheduledDate = new Date(appointment.scheduledDate);
    const appointmentTime = new Date(`2000-01-01T${appointment.startTime}:00`);

    // Lembretes automáticos
    const reminders = [
      {
        type: 'CONFIRMATION',
        scheduledFor: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // 24h antes
        message: `Confirmação: Você tem um agendamento amanhã às ${appointment.startTime} para ${appointment.service.name}`,
      },
      {
        type: 'REMINDER_24H',
        scheduledFor: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // 24h antes
        message: `Lembrete: Seu agendamento para ${appointment.service.name} é amanhã às ${appointment.startTime}`,
      },
      {
        type: 'REMINDER_2H',
        scheduledFor: new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2h antes
        message: `Lembrete: Seu agendamento para ${appointment.service.name} é em 2 horas (${appointment.startTime})`,
      },
    ];

    for (const reminder of reminders) {
      await (this.prisma as any).appointmentReminder.create({
        data: {
          appointmentId,
          reminderType: reminder.type,
          scheduledFor: reminder.scheduledFor,
          message: reminder.message,
          sentVia: defaultChannels,
          createdBy: createdBy,
        },
      });
    }
  }

  private getDayOfWeek(date: Date): string {
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }

  /**
   * Enviar lembretes automáticos para agendamentos que ocorrem em 1 hora
   * Esta função é chamada por um cron job a cada 5 minutos
   */
  async sendReminders(): Promise<{
    success: boolean;
    totalFound: number;
    sent: number;
    failed: number;
    errors: Array<{ appointmentId: string; error: string }>;
  }> {
    try {
      this.logger.log('Iniciando envio de lembretes de agendamentos');

      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora à frente
      const oneHourAndFiveMinutesFromNow = new Date(
        now.getTime() + 65 * 60 * 1000,
      ); // 1h05min à frente (janela de 5 minutos)

      // Buscar agendamentos que ocorrem em 1 hora
      // Considerando scheduledDate + startTime
      // Primeiro, buscar agendamentos com status válido e scheduledDate próximo
      const appointments = await (this.prisma as any).appointment.findMany({
        where: {
          status: {
            notIn: ['CANCELLED', 'COMPLETED'],
          },
          // Filtrar por scheduledDate para reduzir a busca
          scheduledDate: {
            gte: new Date(now.getTime() + 55 * 60 * 1000), // 55 minutos à frente
            lte: new Date(now.getTime() + 70 * 60 * 1000), // 70 minutos à frente
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
          professional: {
            select: {
              id: true,
              name: true,
            },
          },
          notificationLogs: {
            where: {
              status: 'SENT',
              channel: 'WHATSAPP',
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      // Filtrar agendamentos que ocorrem exatamente em 1 hora
      const appointmentsToNotify = appointments.filter((apt: any) => {
        // Combinar scheduledDate com startTime
        const scheduledDate = new Date(apt.scheduledDate);
        const [hours, minutes] = apt.startTime.split(':');
        scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        // Verificar se está na janela de 1 hora (com margem de 5 minutos)
        const isInWindow =
          scheduledDate >= oneHourFromNow &&
          scheduledDate <= oneHourAndFiveMinutesFromNow;

        // Verificar se já foi enviada notificação para este agendamento
        const alreadyNotified = apt.notificationLogs.length > 0;

        return isInWindow && !alreadyNotified;
      });

      this.logger.log(
        `Encontrados ${appointmentsToNotify.length} agendamentos para notificar`,
      );

      let sent = 0;
      let failed = 0;
      const errors: Array<{ appointmentId: string; error: string }> = [];

      // Processar cada agendamento
      for (const appointment of appointmentsToNotify) {
        try {
          // Verificar se o cliente tem telefone
          if (!appointment.client?.phone) {
            this.logger.warn(
              `Cliente ${appointment.clientId} não possui telefone cadastrado`,
            );
            failed++;
            errors.push({
              appointmentId: appointment.id,
              error: 'Cliente não possui telefone cadastrado',
            });
            continue;
          }

          // Montar mensagem personalizada
          const message = this.buildReminderMessage(appointment);

          // Enviar via WhatsApp
          const result = await this.baileysService.sendWhatsAppMessage(
            appointment.client.phone,
            message,
          );

          // Registrar log da notificação
          await (this.prisma as any).appointmentNotificationLog.create({
            data: {
              appointmentId: appointment.id,
              clientId: appointment.client.id,
              phoneNumber: appointment.client.phone,
              message: message,
              status: result.success ? 'SENT' : 'FAILED',
              sentAt: result.success ? new Date() : null,
              errorMessage: result.error || null,
              channel: 'WHATSAPP',
            },
          });

          if (result.success) {
            sent++;
            this.logger.log(
              `Lembrete enviado com sucesso para agendamento ${appointment.id}`,
            );
          } else {
            failed++;
            errors.push({
              appointmentId: appointment.id,
              error: result.error || 'Erro desconhecido',
            });
            this.logger.error(
              `Falha ao enviar lembrete para agendamento ${appointment.id}: ${result.error}`,
            );
          }
        } catch (error: any) {
          failed++;
          const errorMessage = error.message || 'Erro desconhecido';
          errors.push({
            appointmentId: appointment.id,
            error: errorMessage,
          });

          // Registrar log de erro
          try {
            await (this.prisma as any).appointmentNotificationLog.create({
              data: {
                appointmentId: appointment.id,
                clientId: appointment.client?.id || '',
                phoneNumber: appointment.client?.phone || '',
                message: '',
                status: 'FAILED',
                sentAt: null,
                errorMessage: errorMessage,
                channel: 'WHATSAPP',
              },
            });
          } catch (logError) {
            this.logger.error(
              `Erro ao registrar log de notificação: ${logError}`,
            );
          }

          this.logger.error(
            `Erro ao processar agendamento ${appointment.id}: ${errorMessage}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Processamento concluído: ${sent} enviados, ${failed} falhas`,
      );

      return {
        success: true,
        totalFound: appointmentsToNotify.length,
        sent,
        failed,
        errors,
      };
    } catch (error: any) {
      this.logger.error('Erro ao enviar lembretes', error);
      return {
        success: false,
        totalFound: 0,
        sent: 0,
        failed: 0,
        errors: [{ appointmentId: 'system', error: error.message }],
      };
    }
  }

  /**
   * Construir mensagem personalizada de lembrete
   */
  private buildReminderMessage(appointment: any): string {
    const clientName = appointment.client?.name || 'Cliente';
    const serviceName = appointment.service?.name || 'serviço';
    const partnerName = appointment.partner?.name;
    const professionalName = appointment.professional?.name;

    let message = `Olá ${clientName}! 👋\n\n`;
    message += `Lembrete: você tem um agendamento daqui a 1 hora.\n\n`;
    message += `📅 Serviço: ${serviceName}\n`;

    if (professionalName) {
      message += `👨‍⚕️ Profissional: ${professionalName}\n`;
    }

    if (partnerName) {
      message += `🤝 Parceiro: ${partnerName}\n`;
    }

    message += `⏰ Horário: ${appointment.startTime}\n\n`;
    message += `Caso precise reprogramar, estamos à disposição.`;

    return message;
  }
}
