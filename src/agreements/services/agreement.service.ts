import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgreementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    healthPlanId: string;
    clientId: string;
    agreementNumber: string;
    cardNumber?: string;
    validity?: Date;
    isActive?: boolean;
  }) {
    // Verifica se o cliente existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID ${data.clientId} não encontrado`);
    }

    // Verifica se o plano de saúde existe
    const healthPlan = await this.prisma.healthPlan.findUnique({
      where: { id: data.healthPlanId },
    });

    if (!healthPlan) {
      throw new NotFoundException(`Plano de saúde com ID ${data.healthPlanId} não encontrado`);
    }

    // Verifica se já existe um convênio ativo para este cliente e plano
    const existingAgreement = await this.prisma.agreement.findFirst({
      where: {
        clientId: data.clientId,
        healthPlanId: data.healthPlanId,
        isActive: true,
      },
    });

    if (existingAgreement) {
      throw new BadRequestException('Cliente já possui um convênio ativo com este plano de saúde');
    }

    return this.prisma.agreement.create({
      data: {
        healthPlanId: data.healthPlanId,
        clientId: data.clientId,
        agreementNumber: data.agreementNumber,
        cardNumber: data.cardNumber,
        validity: data.validity,
        isActive: data.isActive ?? true,
      },
      include: {
        healthPlan: true,
        client: true,
        discounts: true,
        payments: {
          include: {
            payment: true,
          },
        },
        coverageAlerts: true,
      },
    });
  }

  async findAll() {
    return this.prisma.agreement.findMany({
      where: { isActive: true },
      include: {
        healthPlan: true,
        client: true,
        discounts: {
          include: {
            service: true,
            package: true,
          },
        },
        payments: {
          include: {
            payment: {
              include: {
                service: true,
              },
            },
          },
        },
        coverageAlerts: {
          where: { isResolved: false },
        },
      },
    });
  }

  async findById(id: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: {
        healthPlan: true,
        client: true,
        discounts: {
          include: {
            service: true,
            package: true,
          },
        },
        payments: {
          include: {
            payment: {
              include: {
                service: true,
                appointment: true,
              },
            },
          },
        },
        coverageAlerts: {
          include: {
            service: true,
            package: true,
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException(`Convênio com ID ${id} não encontrado`);
    }

    return agreement;
  }

  async findByClientId(clientId: string) {
    return this.prisma.agreement.findMany({
      where: { 
        clientId,
        isActive: true,
      },
      include: {
        healthPlan: true,
        discounts: {
          include: {
            service: true,
            package: true,
          },
        },
        payments: {
          include: {
            payment: {
              include: {
                service: true,
              },
            },
          },
        },
        coverageAlerts: {
          where: { isResolved: false },
        },
      },
    });
  }

  async findActiveByClientId(clientId: string) {
    return this.prisma.agreement.findMany({
      where: { 
        clientId,
        isActive: true,
        validity: {
          gte: new Date(), // Convênios válidos (não expirados)
        },
      },
      include: {
        healthPlan: true,
        discounts: {
          include: {
            service: true,
            package: true,
          },
        },
      },
    });
  }

  async findByHealthPlanId(healthPlanId: string) {
    return this.prisma.agreement.findMany({
      where: { 
        healthPlanId,
        isActive: true,
      },
      include: {
        client: true,
        discounts: {
          include: {
            service: true,
            package: true,
          },
        },
        payments: {
          include: {
            payment: {
              include: {
                service: true,
              },
            },
          },
        },
        coverageAlerts: {
          where: { isResolved: false },
        },
      },
    });
  }

  async update(id: string, data: {
    agreementNumber?: string;
    cardNumber?: string;
    validity?: Date;
    isActive?: boolean;
  }) {
    await this.findById(id); // Verifica se existe

    return this.prisma.agreement.update({
      where: { id },
      data,
      include: {
        healthPlan: true,
        client: true,
        discounts: true,
        payments: {
          include: {
            payment: true,
          },
        },
        coverageAlerts: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id); // Verifica se existe

    // Soft delete - apenas marca como inativo
    return this.prisma.agreement.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async checkValidity(id: string) {
    const agreement = await this.findById(id);
    
    if (!agreement.validity) {
      return { isValid: true, message: 'Convênio sem data de validade definida' };
    }

    const now = new Date();
    const isValid = agreement.validity > now;
    
    return {
      isValid,
      message: isValid 
        ? 'Convênio válido' 
        : 'Convênio expirado',
      validityDate: agreement.validity,
    };
  }

  async getAgreementStatistics(id: string) {
    const agreement = await this.findById(id);
    
    const totalPayments = agreement.payments.length;
    const totalAmountCovered = agreement.payments.reduce(
      (sum, ap) => sum + Number(ap.amountCovered), 
      0
    );
    const totalAmountClient = agreement.payments.reduce(
      (sum, ap) => sum + Number(ap.amountClient), 
      0
    );
    const totalDiscounts = agreement.payments.reduce(
      (sum, ap) => sum + Number(ap.discountApplied), 
      0
    );
    const activeAlerts = agreement.coverageAlerts.filter(alert => !alert.isResolved).length;
    const totalDiscountsConfigured = agreement.discounts.length;

    return {
      agreement: {
        id: agreement.id,
        agreementNumber: agreement.agreementNumber,
        client: agreement.client.name,
        healthPlan: agreement.healthPlan.name,
      },
      statistics: {
        totalPayments,
        totalAmountCovered,
        totalAmountClient,
        totalDiscounts,
        activeAlerts,
        totalDiscountsConfigured,
      },
    };
  }

  async findExpiringAgreements(daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.prisma.agreement.findMany({
      where: {
        isActive: true,
        validity: {
          lte: thresholdDate,
          gte: new Date(), // Ainda não expirou
        },
      },
      include: {
        healthPlan: true,
        client: true,
      },
    });
  }

  async findExpiredAgreements() {
    return this.prisma.agreement.findMany({
      where: {
        isActive: true,
        validity: {
          lt: new Date(),
        },
      },
      include: {
        healthPlan: true,
        client: true,
      },
    });
  }
}
