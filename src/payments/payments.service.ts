﻿import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreatePaymentDto, userId: string) {
        // Verificar se o cliente existe
        const client = await this.prisma.client.findUnique({
            where: { id: dto.clientId }
        });
        if (!client) {
            throw new NotFoundException('Cliente nÃ£o encontrado');
        }

        // Verificar se o serviÃ§o existe
        const service = await this.prisma.service.findUnique({
            where: { id: dto.serviceId }
        });
        if (!service) {
            throw new NotFoundException('ServiÃ§o nÃ£o encontrado');
        }

        // Verificar se o agendamento existe (se fornecido)
        if (dto.appointmentId) {
            const appointment = await this.prisma.appointment.findUnique({
                where: { id: dto.appointmentId }
            });
            if (!appointment) {
                throw new NotFoundException('Agendamento nÃ£o encontrado');
            }
        }

        // Calcular valor final com base nos percentuais de desconto e valor adicional
        const partnerDiscount = dto.partnerDiscount || 0;
        const clientDiscount = dto.clientDiscount || 0;
        const totalDiscountPercentage = partnerDiscount + clientDiscount;
        const discountAmount = (Number(dto.amount) * totalDiscountPercentage) / 100;
        const additionalValue = dto.additionalValue || 0;
        const finalAmount = Number(dto.amount) - discountAmount + additionalValue;

        if (finalAmount < 0) {
            throw new BadRequestException('O valor final nÃ£o pode ser negativo');
        }

        const paymentData: any = {
            clientId: dto.clientId,
            serviceId: dto.serviceId,
            amount: dto.amount,
            partnerDiscount: partnerDiscount,
            clientDiscount: clientDiscount,
            additionalValue: additionalValue || undefined,
            finalAmount: finalAmount,
            paymentMethod: dto.paymentMethod,
            paymentStatus: dto.paymentStatus || 'PENDING',
            createdBy: userId,
        };

        if (dto.appointmentId) {
            paymentData.appointmentId = dto.appointmentId;
        }

        if (dto.dueDate) {
            paymentData.dueDate = new Date(dto.dueDate);
        }

        if (dto.notes) {
            paymentData.notes = dto.notes;
        }

        if (dto.transactionId) {
            paymentData.transactionId = dto.transactionId;
        }

        const payment = await this.prisma.payment.create({
            data: paymentData,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                appointment: {
                    select: {
                        id: true,
                        scheduledDate: true,
                        startTime: true,
                        endTime: true,
                        partner: {
                            select: {
                                name: true,
                            }
                        }
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentPrice: true,
                        duration: true,
                        color: true,
                    }
                },
            }
        });

        // Gerar recibo automaticamente se solicitado
        if (dto.generateReceipt !== false) {
            await this.generateReceipt(payment.id, userId);
        }

        // Calcular e criar comissÃµes se houver profissional no agendamento
        if (dto.appointmentId) {
            const appointment = await this.prisma.appointment.findUnique({
                where: { id: dto.appointmentId },
                include: { professional: true }
            });

            if (appointment?.professional) {
                await this.calculateCommission(payment.id, appointment.professional.id, finalAmount, userId);
            }
        }

        return payment;
    }

    async findAll(query: ListPaymentsDto) {
        const { page = 1, limit = 10, clientName, paymentMethod, paymentStatus, minAmount, maxAmount, startDate, endDate, sortBy = 'paymentDate', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {};

        if (clientName) {
            where.client = {
                name: { contains: clientName, mode: 'insensitive' }
            };
        }

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        if (paymentStatus) {
            where.paymentStatus = paymentStatus;
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            where.finalAmount = {};
            if (minAmount !== undefined) where.finalAmount.gte = minAmount;
            if (maxAmount !== undefined) where.finalAmount.lte = maxAmount;
        }

        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate.gte = new Date(startDate);
            if (endDate) where.paymentDate.lte = new Date(endDate);
        }

        // Validar campo de ordenaÃ§Ã£o
        const allowedSortFields = ['paymentDate', 'finalAmount', 'paymentStatus', 'paymentMethod', 'createdAt', 'updatedAt'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'paymentDate';

        // Construir ordenaÃ§Ã£o
        const orderBy: any = {};
        orderBy[validSortBy] = sortOrder;

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
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
                    appointment: {
                        select: {
                            id: true,
                            scheduledDate: true,
                            startTime: true,
                            endTime: true,
                        }
                    },
                    service: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            currentPrice: true,
                            duration: true,
                            color: true,
                        }
                    },
                }
            }),
            this.prisma.payment.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        const paymentsWithPartner = payments.map((p: any) => ({
            ...p,
            partnerName: p.appointment?.partner?.name || null,
        }));

        return {
            payments: paymentsWithPartner,
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    async findOne(id: string) {
        const payment = await this.prisma.payment.findUnique({
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
                appointment: {
                    select: {
                        id: true,
                        scheduledDate: true,
                        startTime: true,
                        endTime: true,
                        partner: {
                            select: {
                                name: true,
                            }
                        }
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentPrice: true,
                        duration: true,
                        color: true,
                    }
                },
                receipts: {
                    orderBy: { issuedAt: 'desc' }
                },
                commissions: {
                    include: {
                        professional: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                specialty: true,
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento nÃ£o encontrado');
        }

        return payment;
    }

    async update(id: string, dto: UpdatePaymentDto) {
        // Verificar se o pagamento existe
        const existingPayment = await this.prisma.payment.findUnique({
            where: { id }
        });

        if (!existingPayment) {
            throw new NotFoundException('Pagamento nÃ£o encontrado');
        }

        // Verificar se o serviÃ§o existe (se fornecido)
        if (dto.serviceId) {
            const service = await this.prisma.service.findUnique({
                where: { id: dto.serviceId }
            });
            if (!service) {
                throw new NotFoundException('ServiÃ§o nÃ£o encontrado');
            }
        }

        // Verificar se o agendamento existe (se fornecido)
        if (dto.appointmentId) {
            const appointment = await this.prisma.appointment.findUnique({
                where: { id: dto.appointmentId }
            });
            if (!appointment) {
                throw new NotFoundException('Agendamento nÃ£o encontrado');
            }
        }

        const updateData: any = {};

        // Adicionar campos que foram fornecidos
        if (dto.appointmentId !== undefined) updateData.appointmentId = dto.appointmentId;
        if (dto.serviceId !== undefined) updateData.serviceId = dto.serviceId;
        if (dto.amount !== undefined) updateData.amount = dto.amount;
        if (dto.partnerDiscount !== undefined) updateData.partnerDiscount = dto.partnerDiscount;
        if (dto.clientDiscount !== undefined) updateData.clientDiscount = dto.clientDiscount;
        if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
        if (dto.paymentStatus !== undefined) updateData.paymentStatus = dto.paymentStatus;
        if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.transactionId !== undefined) updateData.transactionId = dto.transactionId;

        // Recalcular valor final se amount ou percentuais de desconto foram alterados
        if (dto.amount !== undefined || dto.partnerDiscount !== undefined || dto.clientDiscount !== undefined || dto.additionalValue !== undefined) {
            const newAmount = dto.amount ?? Number(existingPayment.amount);
            const newPartnerDiscount = dto.partnerDiscount ?? Number(existingPayment.partnerDiscount);
            const newClientDiscount = dto.clientDiscount ?? Number(existingPayment.clientDiscount);
            const totalDiscountPercentage = newPartnerDiscount + newClientDiscount;
            const discountAmount = (newAmount * totalDiscountPercentage) / 100;
            const newAdditionalValue = dto.additionalValue ?? Number((existingPayment as any).additionalValue || 0);
            const newFinalAmount = newAmount - discountAmount + newAdditionalValue;

            if (newFinalAmount < 0) {
                throw new BadRequestException('O valor final não pode ser negativo');
            }

            updateData.finalAmount = newFinalAmount;
        }

        return this.prisma.payment.update({
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
                appointment: {
                    select: {
                        id: true,
                        scheduledDate: true,
                        startTime: true,
                        endTime: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentPrice: true,
                        duration: true,
                        color: true,
                    }
                },
            }
        });
    }

    async remove(id: string) {
        // Verificar se o pagamento existe
        const existingPayment = await this.prisma.payment.findUnique({
            where: { id }
        });

        if (!existingPayment) {
            throw new NotFoundException('Pagamento nÃ£o encontrado');
        }

        await this.prisma.payment.delete({ where: { id } });
        return { message: 'Pagamento deletado com sucesso' };
    }

    async markAsPaid(id: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento nÃ£o encontrado');
        }

        if (payment.paymentStatus === 'PAID') {
            throw new BadRequestException('Pagamento jÃ¡ estÃ¡ pago');
        }

        return this.prisma.payment.update({
            where: { id },
            data: { 
                paymentStatus: 'PAID',
                paymentDate: new Date()
            },
        });
    }

    async refund(id: string, reason: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento nÃ£o encontrado');
        }

        if (payment.paymentStatus === 'REFUNDED') {
            throw new BadRequestException('Pagamento jÃ¡ foi reembolsado');
        }

        return this.prisma.payment.update({
            where: { id },
            data: { 
                paymentStatus: 'REFUNDED',
                notes: reason
            },
        });
    }

    async generateReceipt(paymentId: string, userId: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                client: true,
                service: true,
            }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento nÃ£o encontrado');
        }

        // Gerar nÃºmero do recibo
        const receiptNumber = await this.generateReceiptNumber();

        const receipt = await this.prisma.paymentReceipt.create({
            data: {
                paymentId,
                receiptNumber,
                receiptType: 'RECEIPT',
                amount: payment.finalAmount,
                createdBy: userId,
            }
        });

        // Atualizar o pagamento com o nÃºmero do recibo
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: { receiptNumber }
        });

        return receipt;
    }

    async getStats() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, byStatus, byMethod, today, thisWeek, thisMonth, totalAmount, totalPaid, totalPending, totalOverdue, totalRefunded] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.groupBy({
                by: ['paymentStatus'],
                _count: { paymentStatus: true },
                _sum: { finalAmount: true }
            }),
            this.prisma.payment.groupBy({
                by: ['paymentMethod'],
                _count: { paymentMethod: true },
                _sum: { finalAmount: true }
            }),
            this.prisma.payment.count({
                where: { paymentDate: { gte: startOfDay } }
            }),
            this.prisma.payment.count({
                where: { paymentDate: { gte: startOfWeek } }
            }),
            this.prisma.payment.count({
                where: { paymentDate: { gte: startOfMonth } }
            }),
            this.prisma.payment.aggregate({
                _sum: { finalAmount: true }
            }),
            this.prisma.payment.aggregate({
                where: { paymentStatus: 'PAID' },
                _sum: { finalAmount: true }
            }),
            this.prisma.payment.aggregate({
                where: { paymentStatus: 'PENDING' },
                _sum: { finalAmount: true }
            }),
            this.prisma.payment.aggregate({
                where: { paymentStatus: 'OVERDUE' },
                _sum: { finalAmount: true }
            }),
            this.prisma.payment.aggregate({
                where: { paymentStatus: 'REFUNDED' },
                _sum: { finalAmount: true }
            })
        ]);

        const statusStats: any = {};
        byStatus.forEach((stat: any) => {
            statusStats[stat.paymentStatus] = stat._count.paymentStatus;
        });

        const methodStats: any = {};
        byMethod.forEach((stat: any) => {
            methodStats[stat.paymentMethod] = stat._count.paymentMethod;
        });

        const averageAmount = total > 0 ? Number(totalAmount._sum.finalAmount || 0) / total : 0;

        return {
            total,
            totalAmount: totalAmount._sum.finalAmount || 0,
            totalPaid: totalPaid._sum.finalAmount || 0,
            totalPending: totalPending._sum.finalAmount || 0,
            totalOverdue: totalOverdue._sum.finalAmount || 0,
            totalRefunded: totalRefunded._sum.finalAmount || 0,
            byMethod: methodStats,
            byStatus: statusStats,
            today,
            thisWeek,
            thisMonth,
            averageAmount,
        };
    }

    private async calculateCommission(paymentId: string, professionalId: string, amount: number, userId: string) {
        // Percentual padrÃ£o de comissÃ£o (pode ser configurÃ¡vel)
        const commissionPercentage = 15; // 15%
        const commissionAmount = (amount * commissionPercentage) / 100;

        await this.prisma.commission.create({
            data: {
                paymentId,
                professionalId,
                amount: commissionAmount,
                percentage: commissionPercentage,
                createdBy: userId,
            }
        });
    }

    private async generateReceiptNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.paymentReceipt.count({
            where: {
                createdAt: {
                    gte: new Date(year, 0, 1),
                    lt: new Date(year + 1, 0, 1)
                }
            }
        });

        return `REC${year}${(count + 1).toString().padStart(6, '0')}`;
    }
}
