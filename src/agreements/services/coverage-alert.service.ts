import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertType } from '@prisma/client';

@Injectable()
export class CoverageAlertService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    agreementId: string;
    serviceId?: string;
    packageId?: string;
    alertType: AlertType;
    message: string;
    isResolved?: boolean;
  }) {
    // Verifica se o convênio existe
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: data.agreementId },
    });

    if (!agreement) {
      throw new NotFoundException(`Convênio com ID ${data.agreementId} não encontrado`);
    }

    // Verifica se o serviço existe (se fornecido)
    if (data.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: data.serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Serviço com ID ${data.serviceId} não encontrado`);
      }
    }

    // Verifica se o pacote existe (se fornecido)
    if (data.packageId) {
      const package_ = await this.prisma.servicePackage.findUnique({
        where: { id: data.packageId },
      });

      if (!package_) {
        throw new NotFoundException(`Pacote com ID ${data.packageId} não encontrado`);
      }
    }

    return this.prisma.coverageAlert.create({
      data: {
        agreementId: data.agreementId,
        serviceId: data.serviceId,
        packageId: data.packageId,
        alertType: data.alertType,
        message: data.message,
        isResolved: data.isResolved ?? false,
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
    });
  }

  async findById(id: string) {
    const alert = await this.prisma.coverageAlert.findUnique({
      where: { id },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alerta com ID ${id} não encontrado`);
    }

    return alert;
  }

  async findByAgreementId(agreementId: string) {
    return this.prisma.coverageAlert.findMany({
      where: { agreementId },
      include: {
        service: true,
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findActive() {
    return this.prisma.coverageAlert.findMany({
      where: { isResolved: false },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findResolved() {
    return this.prisma.coverageAlert.findMany({
      where: { isResolved: true },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
      orderBy: {
        resolvedAt: 'desc',
      },
    });
  }

  async findByAlertType(alertType: AlertType) {
    return this.prisma.coverageAlert.findMany({
      where: { 
        alertType,
        isResolved: false,
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: {
    message?: string;
    isResolved?: boolean;
  }) {
    await this.findById(id); // Verifica se existe

    const updateData: any = { ...data };
    
    // Se está marcando como resolvido, adiciona a data de resolução
    if (data.isResolved === true) {
      updateData.resolvedAt = new Date();
    }

    return this.prisma.coverageAlert.update({
      where: { id },
      data: updateData,
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
    });
  }

  async resolve(id: string) {
    return this.update(id, { 
      isResolved: true,
    });
  }

  async delete(id: string) {
    await this.findById(id); // Verifica se existe

    return this.prisma.coverageAlert.delete({
      where: { id },
    });
  }

  async getAlertStatistics() {
    const allAlerts = await this.prisma.coverageAlert.findMany({
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
      },
    });

    const totalAlerts = allAlerts.length;
    const activeAlerts = allAlerts.filter(alert => !alert.isResolved).length;
    const resolvedAlerts = allAlerts.filter(alert => alert.isResolved).length;

    // Agrupa por tipo de alerta
    const alertTypeCounts = allAlerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {});

    // Agrupa por plano de saúde
    const healthPlanCounts = allAlerts.reduce((acc, alert) => {
      const healthPlanName = alert.agreement.healthPlan.name;
      acc[healthPlanName] = (acc[healthPlanName] || 0) + 1;
      return acc;
    }, {});

    // Agrupa por cliente
    const clientCounts = allAlerts.reduce((acc, alert) => {
      const clientName = alert.agreement.client.name;
      acc[clientName] = (acc[clientName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
      alertTypeCounts,
      healthPlanCounts,
      clientCounts,
    };
  }

  async createLimitExceededAlert(agreementId: string, serviceId: string, limitAmount: number, usedAmount: number) {
    return this.create({
      agreementId,
      serviceId,
      alertType: 'LIMIT_EXCEEDED',
      message: `Limite de cobertura excedido para o serviço. Limite: ${limitAmount}, Utilizado: ${usedAmount}`,
    });
  }

  async createExpiringSoonAlert(agreementId: string, validityDate: Date) {
    return this.create({
      agreementId,
      alertType: 'EXPIRING_SOON',
      message: `Convênio expira em breve. Data de validade: ${validityDate.toLocaleDateString()}`,
    });
  }

  async createInvalidAgreementAlert(agreementId: string, reason: string) {
    return this.create({
      agreementId,
      alertType: 'INVALID_AGREEMENT',
      message: `Convênio inválido: ${reason}`,
    });
  }

  async createCoverageDeniedAlert(agreementId: string, serviceId: string, reason: string) {
    return this.create({
      agreementId,
      serviceId,
      alertType: 'COVERAGE_DENIED',
      message: `Cobertura negada para o serviço: ${reason}`,
    });
  }

  async createPaymentDelayedAlert(agreementId: string, daysDelayed: number) {
    return this.create({
      agreementId,
      alertType: 'PAYMENT_DELAYED',
      message: `Pagamento atrasado há ${daysDelayed} dias`,
    });
  }

  async checkExpiringAgreements() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringAgreements = await this.prisma.agreement.findMany({
      where: {
        isActive: true,
        validity: {
          lte: thirtyDaysFromNow,
          gt: new Date(), // Ainda não expirou
        },
      },
      include: {
        healthPlan: true,
        client: true,
        coverageAlerts: {
          where: {
            alertType: 'EXPIRING_SOON',
            isResolved: false,
          },
        },
      },
    });

    const alertsCreated: any[] = [];

    for (const agreement of expiringAgreements) {
      // Só cria alerta se não existir um alerta ativo para este convênio
      if (agreement.coverageAlerts.length === 0) {
        const alert = await this.createExpiringSoonAlert(
          agreement.id,
          agreement.validity!
        );
        alertsCreated.push(alert);
      }
    }

    return {
      agreementsChecked: expiringAgreements.length,
      alertsCreated: alertsCreated.length,
      alerts: alertsCreated,
    };
  }

  async checkExpiredAgreements() {
    const expiredAgreements = await this.prisma.agreement.findMany({
      where: {
        isActive: true,
        validity: {
          lt: new Date(),
        },
      },
      include: {
        healthPlan: true,
        client: true,
        coverageAlerts: {
          where: {
            alertType: 'INVALID_AGREEMENT',
            isResolved: false,
          },
        },
      },
    });

    const alertsCreated: any[] = [];

    for (const agreement of expiredAgreements) {
      // Só cria alerta se não existir um alerta ativo para este convênio
      if (agreement.coverageAlerts.length === 0) {
        const alert = await this.createInvalidAgreementAlert(
          agreement.id,
          'Convênio expirado'
        );
        alertsCreated.push(alert);
      }
    }

    return {
      agreementsChecked: expiredAgreements.length,
      alertsCreated: alertsCreated.length,
      alerts: alertsCreated,
    };
  }

  async getAlertsByClient(clientId: string) {
    return this.prisma.coverageAlert.findMany({
      where: {
        agreement: {
          clientId,
        },
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAlertsByHealthPlan(healthPlanId: string) {
    return this.prisma.coverageAlert.findMany({
      where: {
        agreement: {
          healthPlanId,
        },
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
