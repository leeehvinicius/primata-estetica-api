import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LimitType } from '@prisma/client';

@Injectable()
export class CoverageLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    healthPlanId: string;
    serviceId?: string;
    packageId?: string;
    limitAmount: number;
    limitType: LimitType;
    isActive?: boolean;
  }) {
    // Verifica se o plano de saúde existe
    const healthPlan = await this.prisma.healthPlan.findUnique({
      where: { id: data.healthPlanId },
    });

    if (!healthPlan) {
      throw new NotFoundException(
        `Plano de saúde com ID ${data.healthPlanId} não encontrado`,
      );
    }

    // Verifica se o serviço existe (se fornecido)
    if (data.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: data.serviceId },
      });

      if (!service) {
        throw new NotFoundException(
          `Serviço com ID ${data.serviceId} não encontrado`,
        );
      }
    }

    // Verifica se o pacote existe (se fornecido)
    if (data.packageId) {
      const package_ = await this.prisma.servicePackage.findUnique({
        where: { id: data.packageId },
      });

      if (!package_) {
        throw new NotFoundException(
          `Pacote com ID ${data.packageId} não encontrado`,
        );
      }
    }

    // Verifica se o valor do limite é válido
    if (data.limitAmount < 0) {
      throw new BadRequestException(
        'Valor do limite deve ser maior ou igual a zero',
      );
    }

    // Verifica se já existe um limite para este plano, serviço e pacote
    const existingLimit = await this.prisma.coverageLimit.findFirst({
      where: {
        healthPlanId: data.healthPlanId,
        serviceId: data.serviceId || null,
        packageId: data.packageId || null,
      },
    });

    if (existingLimit) {
      throw new BadRequestException(
        'Já existe um limite configurado para este plano, serviço e pacote',
      );
    }

    return this.prisma.coverageLimit.create({
      data: {
        healthPlanId: data.healthPlanId,
        serviceId: data.serviceId,
        packageId: data.packageId,
        limitAmount: data.limitAmount,
        limitType: data.limitType,
        isActive: data.isActive ?? true,
      },
      include: {
        healthPlan: true,
        service: true,
        package: true,
      },
    });
  }

  async findByHealthPlanId(healthPlanId: string) {
    return this.prisma.coverageLimit.findMany({
      where: {
        healthPlanId,
        isActive: true,
      },
      include: {
        service: true,
        package: true,
      },
    });
  }

  async findById(id: string) {
    const limit = await this.prisma.coverageLimit.findUnique({
      where: { id },
      include: {
        healthPlan: true,
        service: true,
        package: true,
      },
    });

    if (!limit) {
      throw new NotFoundException(
        `Limite de cobertura com ID ${id} não encontrado`,
      );
    }

    return limit;
  }

  async update(
    id: string,
    data: {
      limitAmount?: number;
      limitType?: LimitType;
      isActive?: boolean;
    },
  ) {
    await this.findById(id); // Verifica se existe

    // Verifica se o valor do limite é válido
    if (data.limitAmount !== undefined && data.limitAmount < 0) {
      throw new BadRequestException(
        'Valor do limite deve ser maior ou igual a zero',
      );
    }

    return this.prisma.coverageLimit.update({
      where: { id },
      data,
      include: {
        healthPlan: true,
        service: true,
        package: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id); // Verifica se existe

    // Soft delete - apenas marca como inativo
    return this.prisma.coverageLimit.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async checkLimit(agreementId: string, serviceId: string, amount: number) {
    // Busca o convênio
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        healthPlan: true,
        payments: {
          include: {
            payment: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException(
        `Convênio com ID ${agreementId} não encontrado`,
      );
    }

    // Busca o limite de cobertura para o plano de saúde e serviço
    const coverageLimit = await this.prisma.coverageLimit.findFirst({
      where: {
        healthPlanId: agreement.healthPlanId,
        serviceId: serviceId,
        isActive: true,
      },
    });

    if (!coverageLimit) {
      return {
        isExceeded: false,
        limitAmount: 0,
        usedAmount: 0,
        remainingAmount: 0,
        message: 'Nenhum limite configurado para este serviço',
        coverageLimit: null,
      };
    }

    // Calcula o valor já utilizado baseado no tipo de limite
    let usedAmount = 0;
    const now = new Date();

    switch (coverageLimit.limitType) {
      case 'PER_SESSION':
        // Para limite por sessão, verifica apenas o valor atual
        usedAmount = amount;
        break;

      case 'MONTHLY':
        // Para limite mensal, soma todos os pagamentos do mês atual
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        usedAmount =
          agreement.payments
            .filter((ap) => {
              const paymentDate = new Date(ap.payment.paymentDate);
              return (
                paymentDate >= startOfMonth &&
                paymentDate <= endOfMonth &&
                ap.payment.serviceId === serviceId
              );
            })
            .reduce((sum, ap) => sum + Number(ap.amountCovered), 0) + amount;
        break;

      case 'ANNUAL':
        // Para limite anual, soma todos os pagamentos do ano atual
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);

        usedAmount =
          agreement.payments
            .filter((ap) => {
              const paymentDate = new Date(ap.payment.paymentDate);
              return (
                paymentDate >= startOfYear &&
                paymentDate <= endOfYear &&
                ap.payment.serviceId === serviceId
              );
            })
            .reduce((sum, ap) => sum + Number(ap.amountCovered), 0) + amount;
        break;

      case 'LIFETIME':
        // Para limite vitalício, soma todos os pagamentos
        usedAmount =
          agreement.payments
            .filter((ap) => ap.payment.serviceId === serviceId)
            .reduce((sum, ap) => sum + Number(ap.amountCovered), 0) + amount;
        break;
    }

    const limitAmount = Number(coverageLimit.limitAmount);
    const isExceeded = usedAmount > limitAmount;
    const remainingAmount = Math.max(0, limitAmount - usedAmount);

    return {
      isExceeded,
      limitAmount,
      usedAmount,
      remainingAmount,
      message: isExceeded
        ? `Limite de cobertura excedido. Limite: ${limitAmount}, Utilizado: ${usedAmount}`
        : `Limite de cobertura OK. Limite: ${limitAmount}, Utilizado: ${usedAmount}, Restante: ${remainingAmount}`,
      coverageLimit,
    };
  }

  async checkPackageLimit(
    agreementId: string,
    packageId: string,
    amount: number,
  ) {
    // Busca o convênio
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        healthPlan: true,
        payments: {
          include: {
            payment: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException(
        `Convênio com ID ${agreementId} não encontrado`,
      );
    }

    // Busca o limite de cobertura para o plano de saúde e pacote
    const coverageLimit = await this.prisma.coverageLimit.findFirst({
      where: {
        healthPlanId: agreement.healthPlanId,
        packageId: packageId,
        isActive: true,
      },
    });

    if (!coverageLimit) {
      return {
        isExceeded: false,
        limitAmount: 0,
        usedAmount: 0,
        remainingAmount: 0,
        message: 'Nenhum limite configurado para este pacote',
        coverageLimit: null,
      };
    }

    // Calcula o valor já utilizado baseado no tipo de limite
    let usedAmount = 0;
    const now = new Date();

    switch (coverageLimit.limitType) {
      case 'PER_SESSION':
        usedAmount = amount;
        break;

      case 'MONTHLY':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        usedAmount =
          agreement.payments
            .filter((ap) => {
              const paymentDate = new Date(ap.payment.paymentDate);
              return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
            })
            .reduce((sum, ap) => sum + Number(ap.amountCovered), 0) + amount;
        break;

      case 'ANNUAL':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);

        usedAmount =
          agreement.payments
            .filter((ap) => {
              const paymentDate = new Date(ap.payment.paymentDate);
              return paymentDate >= startOfYear && paymentDate <= endOfYear;
            })
            .reduce((sum, ap) => sum + Number(ap.amountCovered), 0) + amount;
        break;

      case 'LIFETIME':
        usedAmount =
          agreement.payments.reduce(
            (sum, ap) => sum + Number(ap.amountCovered),
            0,
          ) + amount;
        break;
    }

    const limitAmount = Number(coverageLimit.limitAmount);
    const isExceeded = usedAmount > limitAmount;
    const remainingAmount = Math.max(0, limitAmount - usedAmount);

    return {
      isExceeded,
      limitAmount,
      usedAmount,
      remainingAmount,
      message: isExceeded
        ? `Limite de cobertura excedido. Limite: ${limitAmount}, Utilizado: ${usedAmount}`
        : `Limite de cobertura OK. Limite: ${limitAmount}, Utilizado: ${usedAmount}, Restante: ${remainingAmount}`,
      coverageLimit,
    };
  }

  async getLimitStatistics(healthPlanId: string) {
    const limits = await this.findByHealthPlanId(healthPlanId);

    const serviceLimits = limits.filter((l) => l.serviceId && !l.packageId);
    const packageLimits = limits.filter((l) => l.packageId);
    const generalLimits = limits.filter((l) => !l.serviceId && !l.packageId);

    const averageLimitAmount =
      limits.length > 0
        ? limits.reduce((sum, l) => sum + Number(l.limitAmount), 0) /
          limits.length
        : 0;

    const limitTypeCounts = {
      PER_SESSION: limits.filter((l) => l.limitType === 'PER_SESSION').length,
      MONTHLY: limits.filter((l) => l.limitType === 'MONTHLY').length,
      ANNUAL: limits.filter((l) => l.limitType === 'ANNUAL').length,
      LIFETIME: limits.filter((l) => l.limitType === 'LIFETIME').length,
    };

    return {
      totalLimits: limits.length,
      serviceLimits: serviceLimits.length,
      packageLimits: packageLimits.length,
      generalLimits: generalLimits.length,
      averageLimitAmount,
      limitTypeCounts,
      limits: limits,
    };
  }

  async findLimitsByService(serviceId: string) {
    return this.prisma.coverageLimit.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      include: {
        healthPlan: true,
        service: true,
      },
    });
  }

  async findLimitsByPackage(packageId: string) {
    return this.prisma.coverageLimit.findMany({
      where: {
        packageId,
        isActive: true,
      },
      include: {
        healthPlan: true,
        package: true,
      },
    });
  }
}
