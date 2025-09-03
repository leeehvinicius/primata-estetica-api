import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialReportDto, ReportPeriod } from './dto/financial-report.dto';
import { ProfessionalPerformanceDto } from './dto/professional-performance.dto';
import { AppointmentReportDto, AppointmentReportType } from './dto/appointment-report.dto';
import { ServiceAnalysisDto } from './dto/appointment-report.dto';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    // ===== RELATÓRIOS FINANCEIROS =====
    async generateFinancialReport(dto: FinancialReportDto) {
        const { startDate, endDate, period, includeServiceDetails, includeProfessionalDetails, includePaymentMethodDetails } = dto;
        
        // Calcular datas baseado no período
        const dates = this.calculateDateRange(period, startDate, endDate);
        const start = dates.startDate;
        const end = dates.endDate;

        // Buscar dados de pagamentos
        const payments = await (this.prisma as any).payment.findMany({
            where: {
                paymentDate: {
                    gte: start,
                    lte: end
                },
                paymentStatus: 'PAID'
            },
            include: {
                service: true,
                appointment: {
                    include: {
                        professional: true
                    }
                }
            }
        });

        // Calcular métricas financeiras
        const totalRevenue = payments.reduce((sum: number, payment: any) => sum + Number(payment.finalAmount), 0);
        const totalDiscounts = payments.reduce((sum: number, payment: any) => {
            const partnerDiscountAmount = (Number(payment.amount) * Number(payment.partnerDiscount || 0)) / 100;
            const clientDiscountAmount = (Number(payment.amount) * Number(payment.clientDiscount || 0)) / 100;
            return sum + partnerDiscountAmount + clientDiscountAmount;
        }, 0);
        const totalTransactions = payments.length;
        const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // Calcular comissões
        const commissions = await (this.prisma as any).commission.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end
                },
                status: 'PAID'
            }
        });

        const totalCommissions = commissions.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);
        const totalExpenses = totalCommissions; // Pode incluir outras despesas no futuro
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // Calcular crescimento (comparar com período anterior)
        const previousPeriod = this.getPreviousPeriod(start, end);
        const previousPayments = await (this.prisma as any).payment.findMany({
            where: {
                paymentDate: {
                    gte: previousPeriod.start,
                    lte: previousPeriod.end
                },
                paymentStatus: 'PAID'
            }
        });

        const previousRevenue = previousPayments.reduce((sum: number, payment: any) => sum + Number(payment.finalAmount), 0);
        const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        // Detalhes por serviço
        let serviceDetails: any = null;
        if (includeServiceDetails) {
            const serviceStats = await (this.prisma as any).payment.groupBy({
                by: ['serviceId'],
                where: {
                    paymentDate: { gte: start, lte: end },
                    paymentStatus: 'PAID'
                },
                _sum: { finalAmount: true },
                _count: { serviceId: true }
            });

            serviceDetails = await Promise.all(
                serviceStats.map(async (stat: any) => {
                    const service = await (this.prisma as any).service.findUnique({
                        where: { id: stat.serviceId }
                    });
                    return {
                        serviceId: stat.serviceId,
                        serviceName: service?.name || 'Serviço não encontrado',
                        revenue: Number(stat._sum.finalAmount),
                        transactions: stat._count.serviceId,
                        averageValue: stat._count.serviceId > 0 ? Number(stat._sum.finalAmount) / stat._count.serviceId : 0
                    };
                })
            );
        }

        // Detalhes por profissional
        let professionalDetails: any = null;
        if (includeProfessionalDetails) {
            const professionalStats = await (this.prisma as any).commission.groupBy({
                by: ['professionalId'],
                where: {
                    createdAt: { gte: start, lte: end },
                    status: 'PAID'
                },
                _sum: { amount: true },
                _count: { professionalId: true }
            });

            professionalDetails = await Promise.all(
                professionalStats.map(async (stat: any) => {
                    const professional = await (this.prisma as any).professional.findUnique({
                        where: { id: stat.professionalId }
                    });
                    return {
                        professionalId: stat.professionalId,
                        professionalName: professional?.name || 'Profissional não encontrado',
                        commissions: Number(stat._sum.amount),
                        transactions: stat._count.professionalId,
                        averageCommission: stat._count.professionalId > 0 ? Number(stat._sum.amount) / stat._count.professionalId : 0
                    };
                })
            );
        }

        // Detalhes por método de pagamento
        let paymentMethodDetails: any = null;
        if (includePaymentMethodDetails) {
            paymentMethodDetails = await (this.prisma as any).payment.groupBy({
                by: ['paymentMethod'],
                where: {
                    paymentDate: { gte: start, lte: end },
                    paymentStatus: 'PAID'
                },
                _sum: { finalAmount: true },
                _count: { paymentMethod: true }
            });
        }

        // Receita diária
        const dailyRevenue = await (this.prisma as any).payment.groupBy({
            by: ['paymentDate'],
            where: {
                paymentDate: { gte: start, lte: end },
                paymentStatus: 'PAID'
            },
            _sum: { finalAmount: true }
        });

        return {
            period: this.getPeriodDescription(period),
            startDate: start,
            endDate: end,
            totalRevenue,
            totalExpenses,
            netProfit,
            totalCommissions,
            totalDiscounts,
            averageTicket,
            totalTransactions,
            revenueGrowth,
            profitMargin,
            serviceDetails,
            professionalDetails,
            paymentMethodDetails,
            dailyRevenue: dailyRevenue.map((item: any) => ({
                date: item.paymentDate,
                revenue: Number(item._sum.finalAmount)
            }))
        };
    }

    // ===== RELATÓRIOS DE DESEMPENHO DOS PROFISSIONAIS =====
    async generateProfessionalPerformanceReport(dto: ProfessionalPerformanceDto) {
        const { professionalId, startDate, endDate, includeAppointmentDetails, includeCommissionDetails } = dto;
        
        const dates = this.calculateDateRange(ReportPeriod.CUSTOM, startDate, endDate);
        const start = dates.startDate;
        const end = dates.endDate;

        // Buscar agendamentos do profissional
        const appointments = await (this.prisma as any).appointment.findMany({
            where: {
                professionalId: professionalId,
                scheduledDate: { gte: start, lte: end }
            },
            include: {
                service: true,
                client: true
            }
        });

        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter((apt: any) => apt.status === 'COMPLETED').length;
        const cancelledAppointments = appointments.filter((apt: any) => apt.status === 'CANCELLED').length;
        const noShowAppointments = appointments.filter((apt: any) => apt.status === 'NO_SHOW').length;

        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

        // Calcular receita total
        const payments = await (this.prisma as any).payment.findMany({
            where: {
                appointment: {
                    professionalId: professionalId,
                    scheduledDate: { gte: start, lte: end }
                },
                paymentStatus: 'PAID'
            }
        });

        const totalRevenue = payments.reduce((sum: number, payment: any) => sum + Number(payment.finalAmount), 0);
        const averageAppointmentValue = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

        // Calcular comissões
        const commissions = await (this.prisma as any).commission.findMany({
            where: {
                professionalId: professionalId,
                createdAt: { gte: start, lte: end },
                status: 'PAID'
            }
        });

        const totalCommissions = commissions.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);

        // Calcular média de agendamentos por dia
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const averageAppointmentsPerDay = daysDiff > 0 ? totalAppointments / daysDiff : 0;

        // Serviços mais realizados
        const serviceStats = await (this.prisma as any).appointment.groupBy({
            by: ['serviceId'],
            where: {
                professionalId: professionalId,
                scheduledDate: { gte: start, lte: end },
                status: 'COMPLETED'
            },
            _count: { serviceId: true }
        });

        const mostPerformedServices = await Promise.all(
            serviceStats.map(async (stat: any) => {
                const service = await (this.prisma as any).service.findUnique({
                    where: { id: stat.serviceId }
                });
                return {
                    serviceId: stat.serviceId,
                    serviceName: service?.name || 'Serviço não encontrado',
                    count: stat._count.serviceId
                };
            })
        );

        // Buscar dados do profissional
        const professional = professionalId ? await (this.prisma as any).professional.findUnique({
            where: { id: professionalId }
        }) : null;

        let appointmentDetails: any = null;
        if (includeAppointmentDetails) {
            appointmentDetails = appointments.map((apt: any) => ({
                id: apt.id,
                date: apt.scheduledDate,
                time: apt.startTime,
                status: apt.status,
                serviceName: apt.service?.name,
                clientName: apt.client?.name,
                value: apt.service?.currentPrice
            }));
        }

        let commissionDetails: any = null;
        if (includeCommissionDetails) {
            commissionDetails = commissions.map((comm: any) => ({
                id: comm.id,
                amount: Number(comm.amount),
                percentage: Number(comm.percentage),
                status: comm.status,
                paidAt: comm.paidAt
            }));
        }

        return {
            professionalId: professionalId || 'all',
            professionalName: professional?.name || 'Todos os Profissionais',
            period: this.getPeriodDescription(ReportPeriod.CUSTOM),
            startDate: start,
            endDate: end,
            totalAppointments,
            completedAppointments,
            cancelledAppointments,
            noShowAppointments,
            completionRate,
            totalRevenue,
            totalCommissions,
            averageAppointmentValue,
            averageAppointmentsPerDay,
            mostPerformedServices,
            clientSatisfaction: 0, // Pode ser implementado com sistema de avaliação
            appointmentDetails,
            commissionDetails
        };
    }

    // ===== RELATÓRIOS DE AGENDAMENTOS =====
    async generateAppointmentReport(dto: AppointmentReportDto) {
        const { reportType, startDate, endDate, serviceId, professionalId, clientId, includeAppointmentDetails } = dto;
        
        const dates = this.calculateDateRange(ReportPeriod.CUSTOM, startDate, endDate);
        const start = dates.startDate;
        const end = dates.endDate;

        // Construir filtros
        const where: any = {
            scheduledDate: { gte: start, lte: end }
        };

        if (serviceId) where.serviceId = serviceId;
        if (professionalId) where.professionalId = professionalId;
        if (clientId) where.clientId = clientId;

        // Buscar agendamentos
        const appointments = await (this.prisma as any).appointment.findMany({
            where,
            include: {
                service: true,
                professional: true,
                client: true
            }
        });

        const totalAppointments = appointments.length;
        const scheduledAppointments = appointments.filter((apt: any) => apt.status === 'SCHEDULED').length;
        const completedAppointments = appointments.filter((apt: any) => apt.status === 'COMPLETED').length;
        const cancelledAppointments = appointments.filter((apt: any) => apt.status === 'CANCELLED').length;
        const noShowAppointments = appointments.filter((apt: any) => apt.status === 'NO_SHOW').length;

        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
        const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
        const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;

        // Calcular média de agendamentos por dia
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const averageAppointmentsPerDay = daysDiff > 0 ? totalAppointments / daysDiff : 0;

        // Horários de pico
        const hourStats = await (this.prisma as any).appointment.groupBy({
            by: ['startTime'],
            where,
            _count: { startTime: true }
        });

        const peakHours = hourStats
            .map((stat: any) => ({
                hour: stat.startTime,
                count: stat._count.startTime
            }))
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 5);

        // Dias de pico
        const dayStats = await (this.prisma as any).appointment.groupBy({
            by: ['scheduledDate'],
            where,
            _count: { scheduledDate: true }
        });

        const peakDays = dayStats
            .map((stat: any) => ({
                date: stat.scheduledDate,
                count: stat._count.scheduledDate
            }))
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 7);

        // Serviços mais solicitados
        const serviceStats = await (this.prisma as any).appointment.groupBy({
            by: ['serviceId'],
            where,
            _count: { serviceId: true }
        });

        const mostRequestedServices = await Promise.all(
            serviceStats.map(async (stat: any) => {
                const service = await (this.prisma as any).service.findUnique({
                    where: { id: stat.serviceId }
                });
                return {
                    serviceId: stat.serviceId,
                    serviceName: service?.name || 'Serviço não encontrado',
                    count: stat._count.serviceId
                };
            })
        );

        let appointmentDetails: any = null;
        if (includeAppointmentDetails) {
            appointmentDetails = appointments.map((apt: any) => ({
                id: apt.id,
                date: apt.scheduledDate,
                time: apt.startTime,
                status: apt.status,
                serviceName: apt.service?.name,
                professionalName: apt.professional?.name,
                clientName: apt.client?.name
            }));
        }

        return {
            reportType,
            period: this.getPeriodDescription(ReportPeriod.CUSTOM),
            startDate: start,
            endDate: end,
            totalAppointments,
            scheduledAppointments,
            completedAppointments,
            cancelledAppointments,
            noShowAppointments,
            completionRate,
            cancellationRate,
            noShowRate,
            averageAppointmentsPerDay,
            peakHours,
            peakDays,
            mostRequestedServices,
            serviceUtilization: mostRequestedServices,
            appointmentDetails
        };
    }

    // ===== ANÁLISE DE SERVIÇOS =====
    async generateServiceAnalysis(dto: ServiceAnalysisDto) {
        const { startDate, endDate, topN = 10 } = dto;
        
        const dates = this.calculateDateRange(ReportPeriod.CUSTOM, startDate, endDate);
        const start = dates.startDate;
        const end = dates.endDate;

        // Buscar dados de agendamentos e pagamentos
        const appointments = await (this.prisma as any).appointment.findMany({
            where: {
                scheduledDate: { gte: start, lte: end },
                status: 'COMPLETED'
            },
            include: {
                service: true
            }
        });

        const payments = await (this.prisma as any).payment.findMany({
            where: {
                paymentDate: { gte: start, lte: end },
                paymentStatus: 'PAID'
            },
            include: {
                service: true
            }
        });

        const totalServices = appointments.length;
        const totalRevenue = payments.reduce((sum: number, payment: any) => sum + Number(payment.finalAmount), 0);
        const averageServiceValue = totalServices > 0 ? totalRevenue / totalServices : 0;

        // Serviços mais solicitados
        const serviceStats = await (this.prisma as any).appointment.groupBy({
            by: ['serviceId'],
            where: {
                scheduledDate: { gte: start, lte: end },
                status: 'COMPLETED'
            },
            _count: { serviceId: true }
        });

        const mostRequestedServices = await Promise.all(
            serviceStats
                .sort((a: any, b: any) => b._count.serviceId - a._count.serviceId)
                .slice(0, topN)
                .map(async (stat: any) => {
                    const service = await (this.prisma as any).service.findUnique({
                        where: { id: stat.serviceId }
                    });
                    return {
                        serviceId: stat.serviceId,
                        serviceName: service?.name || 'Serviço não encontrado',
                        count: stat._count.serviceId,
                        percentage: (stat._count.serviceId / totalServices) * 100
                    };
                })
        );

        // Serviços com maior receita
        const revenueStats = await (this.prisma as any).payment.groupBy({
            by: ['serviceId'],
            where: {
                paymentDate: { gte: start, lte: end },
                paymentStatus: 'PAID'
            },
            _sum: { finalAmount: true }
        });

        const highestRevenueServices = await Promise.all(
            revenueStats
                .sort((a: any, b: any) => Number(b._sum.finalAmount) - Number(a._sum.finalAmount))
                .slice(0, topN)
                .map(async (stat: any) => {
                    const service = await (this.prisma as any).service.findUnique({
                        where: { id: stat.serviceId }
                    });
                    return {
                        serviceId: stat.serviceId,
                        serviceName: service?.name || 'Serviço não encontrado',
                        revenue: Number(stat._sum.finalAmount),
                        percentage: (Number(stat._sum.finalAmount) / totalRevenue) * 100
                    };
                })
        );

        return {
            period: this.getPeriodDescription(ReportPeriod.CUSTOM),
            startDate: start,
            endDate: end,
            totalServices,
            totalRevenue,
            averageServiceValue,
            mostRequestedServices,
            highestRevenueServices,
            serviceGrowth: [],
            serviceUtilization: mostRequestedServices,
            seasonalTrends: []
        };
    }

    // ===== DASHBOARD =====
    async getDashboard() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Estatísticas gerais
        const [
            totalClients,
            totalProfessionals,
            totalServices,
            totalAppointments,
            totalRevenue,
            totalPayments,
            pendingPayments,
            todayAppointments,
            thisWeekAppointments,
            thisMonthAppointments
        ] = await Promise.all([
            (this.prisma as any).client.count(),
            (this.prisma as any).professional.count(),
            (this.prisma as any).service.count(),
            (this.prisma as any).appointment.count(),
            (this.prisma as any).payment.aggregate({
                where: { paymentStatus: 'PAID' },
                _sum: { finalAmount: true }
            }),
            (this.prisma as any).payment.count({ where: { paymentStatus: 'PAID' } }),
            (this.prisma as any).payment.count({ where: { paymentStatus: 'PENDING' } }),
            (this.prisma as any).appointment.count({
                where: {
                    scheduledDate: { gte: startOfDay }
                }
            }),
            (this.prisma as any).appointment.count({
                where: {
                    scheduledDate: { gte: startOfWeek }
                }
            }),
            (this.prisma as any).appointment.count({
                where: {
                    scheduledDate: { gte: startOfMonth }
                }
            })
        ]);

        // Calcular taxas
        const completedAppointments = await (this.prisma as any).appointment.count({
            where: { status: 'COMPLETED' }
        });
        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

        const totalRevenueValue = totalRevenue._sum.finalAmount || 0;
        const averageTicket = totalPayments > 0 ? totalRevenueValue / totalPayments : 0;

        // Top serviços
        const topServices = await (this.prisma as any).appointment.groupBy({
            by: ['serviceId'],
            _count: { serviceId: true },
            orderBy: { _count: { serviceId: 'desc' } },
            take: 5
        });

        const topServicesWithNames = await Promise.all(
            topServices.map(async (service: any) => {
                const serviceData = await (this.prisma as any).service.findUnique({
                    where: { id: service.serviceId }
                });
                return {
                    serviceId: service.serviceId,
                    serviceName: serviceData?.name || 'Serviço não encontrado',
                    count: service._count.serviceId
                };
            })
        );

        // Top profissionais
        const topProfessionals = await (this.prisma as any).appointment.groupBy({
            by: ['professionalId'],
            _count: { professionalId: true },
            orderBy: { _count: { professionalId: 'desc' } },
            take: 5
        });

        const topProfessionalsWithNames = await Promise.all(
            topProfessionals.map(async (professional: any) => {
                const professionalData = await (this.prisma as any).professional.findUnique({
                    where: { id: professional.professionalId }
                });
                return {
                    professionalId: professional.professionalId,
                    professionalName: professionalData?.name || 'Profissional não encontrado',
                    count: professional._count.professionalId
                };
            })
        );

        // Agendamentos recentes
        const recentAppointments = await (this.prisma as any).appointment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                service: { select: { name: true } },
                professional: { select: { name: true } },
                client: { select: { name: true } }
            }
        });

        // Pagamentos recentes
        const recentPayments = await (this.prisma as any).payment.findMany({
            where: { paymentStatus: 'PAID' },
            orderBy: { paymentDate: 'desc' },
            take: 10,
            include: {
                service: { select: { name: true } },
                client: { select: { name: true } }
            }
        });

        // Alertas de estoque
        const stockAlerts = await (this.prisma as any).stockAlert.findMany({
            where: { isActive: true },
            take: 10,
            include: {
                product: { select: { name: true, currentStock: true, unit: true } }
            }
        });

        // Receita mensal (últimos 12 meses)
        const monthlyRevenue: any[] = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthRevenue = await (this.prisma as any).payment.aggregate({
                where: {
                    paymentDate: { gte: monthStart, lte: monthEnd },
                    paymentStatus: 'PAID'
                },
                _sum: { finalAmount: true }
            });

            monthlyRevenue.push({
                month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                revenue: Number(monthRevenue._sum.finalAmount || 0)
            });
        }

        // Tendências de agendamentos (últimos 30 dias)
        const appointmentTrends: any[] = [];
        for (let i = 29; i >= 0; i--) {
            const dayStart = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000) - 1);

            const dayAppointments = await (this.prisma as any).appointment.count({
                where: {
                    scheduledDate: { gte: dayStart, lte: dayEnd }
                }
            });

            appointmentTrends.push({
                date: dayStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                appointments: dayAppointments
            });
        }

        return {
            totalClients,
            totalProfessionals,
            totalServices,
            totalAppointments,
            totalRevenue: totalRevenueValue,
            totalPayments,
            pendingPayments,
            todayAppointments,
            thisWeekAppointments,
            thisMonthAppointments,
            completionRate,
            averageTicket,
            revenueGrowth: 0, // Pode ser calculado comparando com período anterior
            clientGrowth: 0, // Pode ser calculado comparando com período anterior
            topServices: topServicesWithNames,
            topProfessionals: topProfessionalsWithNames,
            recentAppointments: recentAppointments.map((apt: any) => ({
                id: apt.id,
                date: apt.scheduledDate,
                time: apt.startTime,
                status: apt.status,
                serviceName: apt.service?.name,
                professionalName: apt.professional?.name,
                clientName: apt.client?.name
            })),
            recentPayments: recentPayments.map((payment: any) => ({
                id: payment.id,
                amount: Number(payment.finalAmount),
                date: payment.paymentDate,
                serviceName: payment.service?.name,
                clientName: payment.client?.name
            })),
            stockAlerts: stockAlerts.map((alert: any) => ({
                id: alert.id,
                type: alert.alertType,
                message: alert.message,
                productName: alert.product?.name,
                currentStock: alert.product?.currentStock,
                unit: alert.product?.unit
            })),
            monthlyRevenue,
            appointmentTrends
        };
    }

    // ===== MÉTODOS AUXILIARES =====
    private calculateDateRange(period: ReportPeriod, startDate?: string, endDate?: string) {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        if (period === ReportPeriod.CUSTOM && startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            switch (period) {
                case ReportPeriod.DAILY:
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case ReportPeriod.WEEKLY:
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                    break;
                case ReportPeriod.MONTHLY:
                    start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case ReportPeriod.QUARTERLY:
                    start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
                case ReportPeriod.YEARLY:
                    start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                default:
                    start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            }
        }

        return { startDate: start, endDate: end };
    }

    private getPreviousPeriod(start: Date, end: Date) {
        const duration = end.getTime() - start.getTime();
        const previousEnd = new Date(start.getTime());
        const previousStart = new Date(start.getTime() - duration);
        
        return { start: previousStart, end: previousEnd };
    }

    private getPeriodDescription(period: ReportPeriod): string {
        switch (period) {
            case ReportPeriod.DAILY: return 'Diário';
            case ReportPeriod.WEEKLY: return 'Semanal';
            case ReportPeriod.MONTHLY: return 'Mensal';
            case ReportPeriod.QUARTERLY: return 'Trimestral';
            case ReportPeriod.YEARLY: return 'Anual';
            case ReportPeriod.CUSTOM: return 'Personalizado';
            default: return 'Mensal';
        }
    }
}
