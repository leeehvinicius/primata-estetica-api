import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgreementPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    agreementId: string;
    paymentId: string;
    amountCovered: number;
    amountClient: number;
    discountApplied: number;
    isActive?: boolean;
  }) {
    // Verifica se o convênio existe
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: data.agreementId },
    });

    if (!agreement) {
      throw new NotFoundException(
        `Convênio com ID ${data.agreementId} não encontrado`,
      );
    }

    // Verifica se o pagamento existe
    const payment = await this.prisma.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!payment) {
      throw new NotFoundException(
        `Pagamento com ID ${data.paymentId} não encontrado`,
      );
    }

    // Verifica se já existe um pagamento de convênio para este pagamento
    const existingAgreementPayment =
      await this.prisma.agreementPayment.findFirst({
        where: { paymentId: data.paymentId },
      });

    if (existingAgreementPayment) {
      throw new BadRequestException(
        'Já existe um pagamento de convênio para este pagamento',
      );
    }

    // Verifica se os valores são válidos
    if (
      data.amountCovered < 0 ||
      data.amountClient < 0 ||
      data.discountApplied < 0
    ) {
      throw new BadRequestException(
        'Valores devem ser maiores ou iguais a zero',
      );
    }

    const totalAmount = data.amountCovered + data.amountClient;
    if (Math.abs(totalAmount - Number(payment.finalAmount)) > 0.01) {
      throw new BadRequestException(
        'Soma dos valores cobertos e do cliente deve ser igual ao valor final do pagamento',
      );
    }

    return this.prisma.agreementPayment.create({
      data: {
        agreementId: data.agreementId,
        paymentId: data.paymentId,
        amountCovered: data.amountCovered,
        amountClient: data.amountClient,
        discountApplied: data.discountApplied,
        isActive: data.isActive ?? true,
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        payment: {
          include: {
            service: true,
            appointment: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const agreementPayment = await this.prisma.agreementPayment.findUnique({
      where: { id },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        payment: {
          include: {
            service: true,
            appointment: true,
          },
        },
      },
    });

    if (!agreementPayment) {
      throw new NotFoundException(
        `Pagamento de convênio com ID ${id} não encontrado`,
      );
    }

    return agreementPayment;
  }

  async findByAgreementId(agreementId: string) {
    return this.prisma.agreementPayment.findMany({
      where: {
        agreementId,
        isActive: true,
      },
      include: {
        payment: {
          include: {
            service: true,
            appointment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByClientId(clientId: string) {
    return this.prisma.agreementPayment.findMany({
      where: {
        agreement: {
          clientId,
        },
        isActive: true,
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        payment: {
          include: {
            service: true,
            appointment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByHealthPlanId(
    healthPlanId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const whereClause: any = {
      agreement: {
        healthPlanId,
      },
      isActive: true,
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.agreementPayment.findMany({
      where: whereClause,
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        payment: {
          include: {
            service: true,
            appointment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: {
      amountCovered?: number;
      amountClient?: number;
      discountApplied?: number;
      isActive?: boolean;
    },
  ) {
    await this.findById(id); // Verifica se existe

    // Verifica se os valores são válidos
    if (data.amountCovered !== undefined && data.amountCovered < 0) {
      throw new BadRequestException(
        'Valor coberto deve ser maior ou igual a zero',
      );
    }

    if (data.amountClient !== undefined && data.amountClient < 0) {
      throw new BadRequestException(
        'Valor do cliente deve ser maior ou igual a zero',
      );
    }

    if (data.discountApplied !== undefined && data.discountApplied < 0) {
      throw new BadRequestException(
        'Desconto aplicado deve ser maior ou igual a zero',
      );
    }

    return this.prisma.agreementPayment.update({
      where: { id },
      data,
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        payment: {
          include: {
            service: true,
            appointment: true,
          },
        },
      },
    });
  }

  async processPayment(paymentData: any, agreementId: string) {
    // Verifica se o convênio existe e está ativo
    const agreement = await this.prisma.agreement.findUnique({
      where: {
        id: agreementId,
        isActive: true,
      },
      include: {
        healthPlan: true,
        client: true,
        discounts: {
          where: { isActive: true },
          include: {
            service: true,
            package: true,
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException(
        `Convênio ativo com ID ${agreementId} não encontrado`,
      );
    }

    // Verifica se o convênio não expirou
    if (agreement.validity && agreement.validity < new Date()) {
      throw new BadRequestException('Convênio expirado');
    }

    // Calcula o desconto baseado no serviço
    const originalAmount = Number(paymentData.amount);
    let discountAmount = 0;
    let discountPercentage = 0;

    // Busca desconto específico para o serviço
    let discount = agreement.discounts.find(
      (d) => d.serviceId === paymentData.serviceId && !d.packageId,
    );

    // Se não encontrar desconto específico, busca desconto geral
    if (!discount) {
      discount = agreement.discounts.find((d) => !d.serviceId && !d.packageId);
    }

    if (discount) {
      discountPercentage = Number(discount.discountPercentage);
      discountAmount = (originalAmount * discountPercentage) / 100;
    }

    // Calcula os valores
    const finalAmount = originalAmount - discountAmount;
    const amountCovered = Math.min(discountAmount, originalAmount); // O convênio cobre o desconto
    const amountClient = finalAmount; // O cliente paga o valor final

    // Cria o pagamento
    const payment = await this.prisma.payment.create({
      data: {
        clientId: agreement.clientId,
        appointmentId: paymentData.appointmentId,
        serviceId: paymentData.serviceId,
        amount: originalAmount,
        partnerDiscount: discountPercentage, // O desconto do convênio é considerado como desconto do parceiro
        clientDiscount: 0, // Cliente não tem desconto adicional
        finalAmount: finalAmount,
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: paymentData.paymentStatus || 'PENDING',
        paymentDate: new Date(),
        dueDate: paymentData.dueDate,
        notes: paymentData.notes,
        createdBy: paymentData.createdBy,
      },
    });

    // Cria o pagamento de convênio
    const agreementPayment = await this.create({
      agreementId,
      paymentId: payment.id,
      amountCovered,
      amountClient,
      discountApplied: discountAmount,
    });

    return {
      payment,
      agreementPayment,
      discount: {
        percentage: discountPercentage,
        amount: discountAmount,
      },
      breakdown: {
        originalAmount,
        amountCovered,
        amountClient,
        finalAmount,
      },
    };
  }

  async getPaymentStatistics(agreementId: string) {
    const payments = await this.findByAgreementId(agreementId);

    const totalPayments = payments.length;
    const totalAmountCovered = payments.reduce(
      (sum, ap) => sum + Number(ap.amountCovered),
      0,
    );
    const totalAmountClient = payments.reduce(
      (sum, ap) => sum + Number(ap.amountClient),
      0,
    );
    const totalDiscounts = payments.reduce(
      (sum, ap) => sum + Number(ap.discountApplied),
      0,
    );

    // Agrupa por serviço
    const serviceBreakdown = payments.reduce((acc, ap) => {
      const serviceName = ap.payment.service.name;
      if (!acc[serviceName]) {
        acc[serviceName] = {
          count: 0,
          totalAmountCovered: 0,
          totalAmountClient: 0,
          totalDiscounts: 0,
        };
      }
      acc[serviceName].count++;
      acc[serviceName].totalAmountCovered += Number(ap.amountCovered);
      acc[serviceName].totalAmountClient += Number(ap.amountClient);
      acc[serviceName].totalDiscounts += Number(ap.discountApplied);
      return acc;
    }, {});

    return {
      totalPayments,
      totalAmountCovered,
      totalAmountClient,
      totalDiscounts,
      averageDiscountPercentage:
        totalPayments > 0 ? (totalDiscounts / totalAmountCovered) * 100 : 0,
      serviceBreakdown,
      payments,
    };
  }

  async getHealthPlanPaymentStatistics(
    healthPlanId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const payments = await this.findByHealthPlanId(
      healthPlanId,
      startDate,
      endDate,
    );

    const totalPayments = payments.length;
    const totalAmountCovered = payments.reduce(
      (sum, ap) => sum + Number(ap.amountCovered),
      0,
    );
    const totalAmountClient = payments.reduce(
      (sum, ap) => sum + Number(ap.amountClient),
      0,
    );
    const totalDiscounts = payments.reduce(
      (sum, ap) => sum + Number(ap.discountApplied),
      0,
    );

    // Agrupa por cliente
    const clientBreakdown = payments.reduce((acc, ap) => {
      const clientName = ap.agreement.client.name;
      if (!acc[clientName]) {
        acc[clientName] = {
          count: 0,
          totalAmountCovered: 0,
          totalAmountClient: 0,
          totalDiscounts: 0,
        };
      }
      acc[clientName].count++;
      acc[clientName].totalAmountCovered += Number(ap.amountCovered);
      acc[clientName].totalAmountClient += Number(ap.amountClient);
      acc[clientName].totalDiscounts += Number(ap.discountApplied);
      return acc;
    }, {});

    return {
      totalPayments,
      totalAmountCovered,
      totalAmountClient,
      totalDiscounts,
      averageDiscountPercentage:
        totalPayments > 0 ? (totalDiscounts / totalAmountCovered) * 100 : 0,
      clientBreakdown,
      payments,
    };
  }

  async generateReceipt(agreementPaymentId: string) {
    const agreementPayment = await this.findById(agreementPaymentId);

    return {
      receiptNumber: `AG-${agreementPayment.id.slice(-8).toUpperCase()}`,
      issueDate: new Date(),
      agreement: {
        number: agreementPayment.agreement.agreementNumber,
        healthPlan: agreementPayment.agreement.healthPlan.name,
        client: agreementPayment.agreement.client.name,
      },
      service: agreementPayment.payment.service.name,
      breakdown: {
        originalAmount: Number(agreementPayment.payment.amount),
        amountCovered: Number(agreementPayment.amountCovered),
        amountClient: Number(agreementPayment.amountClient),
        discountApplied: Number(agreementPayment.discountApplied),
      },
      total: Number(agreementPayment.payment.finalAmount),
    };
  }
}
