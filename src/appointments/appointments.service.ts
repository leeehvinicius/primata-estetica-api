import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateAppointmentDto, userId: string) {
        // Se userId não foi fornecido, buscar um usuário admin padrão
        let createdBy = userId;
        if (!createdBy) {
            const adminUser = await (this.prisma as any).user.findFirst({
                where: {
                    profile: { role: 'ADMINISTRADOR' }
                }
            });
            if (adminUser) {
                createdBy = adminUser.id;
            } else {
                throw new ConflictException('Usuário não encontrado para criar o agendamento');
            }
        }

        // Verificar se o cliente existe
        const client = await (this.prisma as any).client.findUnique({
            where: { id: dto.clientId }
        });
        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }

        // Verificar se o serviço existe
        const service = await (this.prisma as any).service.findUnique({
            where: { id: dto.serviceId }
        });
        if (!service) {
            throw new NotFoundException('Serviço não encontrado');
        }

        // Verificar se o profissional existe (se fornecido)
        if (dto.professionalId) {
            const professional = await (this.prisma as any).professional.findUnique({
                where: { id: dto.professionalId }
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
            dto.serviceId
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
                    }
                },
                professional: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        specialty: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentPrice: true,
                        duration: true,
                    }
                },
            }
        });

        // Criar lembretes automáticos
        await this.createAutomaticReminders(appointment.id, userId, dto.notificationChannels);

        return appointment;
    }

    async findAll(query: ListAppointmentsDto) {
        const { page = 1, limit = 10, clientName, professionalName, appointmentType, status, priority, startDate, endDate, sortBy = 'scheduledDate', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {};

        if (clientName) {
            where.client = {
                name: { contains: clientName, mode: 'insensitive' }
            };
        }

        if (professionalName) {
            where.professional = {
                name: { contains: professionalName, mode: 'insensitive' }
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
        const allowedSortFields = ['scheduledDate', 'startTime', 'status', 'priority', 'createdAt', 'updatedAt'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'scheduledDate';

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
                        }
                    },
                    professional: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            specialty: true,
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            currentPrice: true,
                            duration: true,
                        }
                    },
                }
            }),
            (this.prisma as any).appointment.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            appointments,
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
                    }
                },
                professional: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        specialty: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentPrice: true,
                        duration: true,
                    }
                },
                reminders: {
                    orderBy: { scheduledFor: 'asc' }
                }
            }
        });

        if (!appointment) {
            throw new NotFoundException('Agendamento não encontrado');
        }

        return appointment;
    }

    async update(id: string, dto: UpdateAppointmentDto) {
        // Verificar se o agendamento existe
        const existingAppointment = await (this.prisma as any).appointment.findUnique({
            where: { id }
        });

        if (!existingAppointment) {
            throw new NotFoundException('Agendamento não encontrado');
        }

        // Verificar se o profissional existe (se fornecido)
        if (dto.professionalId) {
            const professional = await (this.prisma as any).professional.findUnique({
                where: { id: dto.professionalId }
            });
            if (!professional) {
                throw new NotFoundException('Profissional não encontrado');
            }
        }

        // Verificar se o serviço existe (se fornecido)
        if (dto.serviceId) {
            const service = await (this.prisma as any).service.findUnique({
                where: { id: dto.serviceId }
            });
            if (!service) {
                throw new NotFoundException('Serviço não encontrado');
            }
        }

        const updateData: any = {};

        // Adicionar campos que foram fornecidos
        if (dto.professionalId !== undefined) updateData.professionalId = dto.professionalId;
        if (dto.serviceId !== undefined) updateData.serviceId = dto.serviceId;
        if (dto.scheduledDate !== undefined) updateData.scheduledDate = new Date(dto.scheduledDate);
        if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
        if (dto.appointmentType !== undefined) updateData.appointmentType = dto.appointmentType;
        if (dto.priority !== undefined) updateData.priority = dto.priority;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.cancellationReason !== undefined) updateData.cancellationReason = dto.cancellationReason;

        // Se mudou data/hora, recalcular horário de fim
        if (dto.scheduledDate || dto.startTime || dto.serviceId) {
            const service = dto.serviceId ? 
                await (this.prisma as any).service.findUnique({ where: { id: dto.serviceId } }) :
                await (this.prisma as any).service.findUnique({ where: { id: existingAppointment.serviceId } });

            const startTime = new Date(`2000-01-01T${dto.startTime || existingAppointment.startTime}:00`);
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
                    }
                },
                professional: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        specialty: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentPrice: true,
                        duration: true,
                    }
                },
            }
        });
    }

    async remove(id: string) {
        // Verificar se o agendamento existe
        const existingAppointment = await (this.prisma as any).appointment.findUnique({
            where: { id }
        });

        if (!existingAppointment) {
            throw new NotFoundException('Agendamento não encontrado');
        }

        await (this.prisma as any).appointment.delete({ where: { id } });
        return { message: 'Agendamento deletado com sucesso' };
    }

    async cancel(id: string, reason: string) {
        const appointment = await (this.prisma as any).appointment.findUnique({
            where: { id }
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
                cancellationReason: reason
            },
        });
    }

    async reschedule(id: string, newDate: string, newTime: string) {
        const appointment = await (this.prisma as any).appointment.findUnique({
            where: { id }
        });

        if (!appointment) {
            throw new NotFoundException('Agendamento não encontrado');
        }

        if (appointment.status === 'CANCELLED') {
            throw new BadRequestException('Não é possível remarcar um agendamento cancelado');
        }

        // Verificar disponibilidade do novo horário
        const service = await (this.prisma as any).service.findUnique({
            where: { id: appointment.serviceId }
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
            id // Excluir o próprio agendamento da verificação
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
            }
        });

        // Cancelar agendamento original
        await (this.prisma as any).appointment.update({
            where: { id },
            data: { 
                status: 'RESCHEDULED',
                cancellationReason: 'Remarcado para novo horário'
            }
        });

        return newAppointment;
    }

    async getStats() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, byStatus, byType, byPriority, today, thisWeek, thisMonth] = await Promise.all([
            (this.prisma as any).appointment.count(),
            (this.prisma as any).appointment.groupBy({
                by: ['status'],
                _count: { status: true }
            }),
            (this.prisma as any).appointment.groupBy({
                by: ['appointmentType'],
                _count: { appointmentType: true }
            }),
            (this.prisma as any).appointment.groupBy({
                by: ['priority'],
                _count: { priority: true }
            }),
            (this.prisma as any).appointment.count({
                where: { scheduledDate: { gte: startOfDay } }
            }),
            (this.prisma as any).appointment.count({
                where: { scheduledDate: { gte: startOfWeek } }
            }),
            (this.prisma as any).appointment.count({
                where: { scheduledDate: { gte: startOfMonth } }
            })
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

    async checkAvailability(date: string, startTime: string, endTime: string, professionalId?: string, serviceId?: string, excludeAppointmentId?: string) {
        const scheduledDate = new Date(date);
        const dayOfWeek = this.getDayOfWeek(scheduledDate);

        // Verificar se o profissional está disponível neste dia
        if (professionalId) {
            const professionalSchedule = await (this.prisma as any).professionalSchedule.findFirst({
                where: {
                    professionalId,
                    dayOfWeek,
                    isActive: true,
                }
            });

            if (!professionalSchedule) {
                return false; // Profissional não trabalha neste dia
            }

            // Verificar se o horário está dentro do horário de trabalho
            if (startTime < professionalSchedule.startTime || endTime > professionalSchedule.endTime) {
                return false;
            }
        }

        // Verificar conflitos de horário
        const conflictingAppointments = await (this.prisma as any).appointment.findMany({
            where: {
                scheduledDate,
                status: {
                    notIn: ['CANCELLED', 'NO_SHOW']
                },
                OR: [
                    {
                        startTime: { lt: endTime },
                        endTime: { gt: startTime }
                    }
                ],
                ...(professionalId && { professionalId }),
                ...(excludeAppointmentId && { id: { not: excludeAppointmentId } })
            }
        });

        return conflictingAppointments.length === 0;
    }

    async getAvailableSlots(date: string, professionalId?: string, serviceId?: string) {
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
            const slotEnd = new Date(startTime.getTime() + slotDuration * 60000).toTimeString().slice(0, 5);

            // Verificar se o slot está disponível
            const isAvailable = await this.checkAvailability(date, slotStart, slotEnd, professionalId, serviceId);
            
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

    private async createAutomaticReminders(appointmentId: string, userId: string, channels?: string[]) {
        // Se userId não foi fornecido, buscar um usuário admin padrão
        let createdBy = userId;
        if (!createdBy) {
            const adminUser = await (this.prisma as any).user.findFirst({
                where: {
                    profile: { role: 'ADMINISTRADOR' }
                }
            });
            if (adminUser) {
                createdBy = adminUser.id;
            } else {
                throw new ConflictException('Usuário não encontrado para criar os lembretes');
            }
        }

        const appointment = await (this.prisma as any).appointment.findUnique({
            where: { id: appointmentId },
            include: {
                client: true,
                service: true,
            }
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
                }
            });
        }
    }

    private getDayOfWeek(date: Date): string {
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[date.getDay()];
    }
}
