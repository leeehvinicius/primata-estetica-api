import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    planType: string;
    operatorCode: string;
    isActive?: boolean;
  }) {
    return this.prisma.healthPlan.create({
      data: {
        name: data.name,
        planType: data.planType,
        operatorCode: data.operatorCode,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.healthPlan.findMany({
      where: { isActive: true },
      include: {
        agreements: {
          include: {
            client: true,
          },
        },
        coverageLimits: true,
        operatorIntegrations: true,
      },
    });
  }

  async findById(id: string) {
    const healthPlan = await this.prisma.healthPlan.findUnique({
      where: { id },
      include: {
        agreements: {
          include: {
            client: true,
            discounts: true,
            payments: true,
          },
        },
        coverageLimits: {
          include: {
            service: true,
            package: true,
          },
        },
        operatorIntegrations: true,
      },
    });

    if (!healthPlan) {
      throw new NotFoundException(`Plano de saúde com ID ${id} não encontrado`);
    }

    return healthPlan;
  }

  async update(
    id: string,
    data: {
      name?: string;
      planType?: string;
      operatorCode?: string;
      isActive?: boolean;
    },
  ) {
    await this.findById(id); // Verifica se existe

    return this.prisma.healthPlan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id); // Verifica se existe

    // Soft delete - apenas marca como inativo
    return this.prisma.healthPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByOperatorCode(operatorCode: string) {
    return this.prisma.healthPlan.findFirst({
      where: {
        operatorCode,
        isActive: true,
      },
    });
  }

  async getActiveHealthPlans() {
    return this.prisma.healthPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        planType: true,
        operatorCode: true,
      },
    });
  }

  async getHealthPlanStatistics(id: string) {
    const healthPlan = await this.findById(id);

    const totalAgreements = healthPlan.agreements.length;
    const activeAgreements = healthPlan.agreements.filter(
      (a) => a.isActive,
    ).length;
    const totalCoverageLimits = healthPlan.coverageLimits.length;
    const totalIntegrations = healthPlan.operatorIntegrations.length;

    return {
      healthPlan: {
        id: healthPlan.id,
        name: healthPlan.name,
        planType: healthPlan.planType,
        operatorCode: healthPlan.operatorCode,
      },
      statistics: {
        totalAgreements,
        activeAgreements,
        totalCoverageLimits,
        totalIntegrations,
      },
    };
  }
}
