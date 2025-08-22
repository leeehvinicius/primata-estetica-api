import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgreementDiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    agreementId: string;
    serviceId?: string;
    packageId?: string;
    discountPercentage: number;
    isActive?: boolean;
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

    // Verifica se o percentual de desconto é válido
    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      throw new BadRequestException('Percentual de desconto deve estar entre 0 e 100');
    }

    // Verifica se já existe um desconto para este convênio, serviço e pacote
    const existingDiscount = await this.prisma.agreementDiscount.findFirst({
      where: {
        agreementId: data.agreementId,
        serviceId: data.serviceId || null,
        packageId: data.packageId || null,
      },
    });

    if (existingDiscount) {
      throw new BadRequestException('Já existe um desconto configurado para este convênio, serviço e pacote');
    }

    return this.prisma.agreementDiscount.create({
      data: {
        agreementId: data.agreementId,
        serviceId: data.serviceId,
        packageId: data.packageId,
        discountPercentage: data.discountPercentage,
        isActive: data.isActive ?? true,
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

  async findByAgreementId(agreementId: string) {
    return this.prisma.agreementDiscount.findMany({
      where: { 
        agreementId,
        isActive: true,
      },
      include: {
        service: true,
        package: true,
      },
    });
  }

  async findById(id: string) {
    const discount = await this.prisma.agreementDiscount.findUnique({
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

    if (!discount) {
      throw new NotFoundException(`Desconto com ID ${id} não encontrado`);
    }

    return discount;
  }

  async update(id: string, data: {
    discountPercentage?: number;
    isActive?: boolean;
  }) {
    await this.findById(id); // Verifica se existe

    // Verifica se o percentual de desconto é válido
    if (data.discountPercentage !== undefined && (data.discountPercentage < 0 || data.discountPercentage > 100)) {
      throw new BadRequestException('Percentual de desconto deve estar entre 0 e 100');
    }

    return this.prisma.agreementDiscount.update({
      where: { id },
      data,
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

  async delete(id: string) {
    await this.findById(id); // Verifica se existe

    // Soft delete - apenas marca como inativo
    return this.prisma.agreementDiscount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async calculateDiscount(agreementId: string, serviceId: string, amount: number) {
    // Busca o convênio e verifica se está ativo
    const agreement = await this.prisma.agreement.findUnique({
      where: { 
        id: agreementId,
        isActive: true,
      },
      include: {
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
      throw new NotFoundException(`Convênio ativo com ID ${agreementId} não encontrado`);
    }

    // Verifica se o convênio não expirou
    if (agreement.validity && agreement.validity < new Date()) {
      return {
        discountAmount: 0,
        discountPercentage: 0,
        message: 'Convênio expirado',
        agreement: agreement,
      };
    }

    // Busca desconto específico para o serviço
    let discount = agreement.discounts.find(d => 
      d.serviceId === serviceId && !d.packageId
    );

    // Se não encontrar desconto específico para o serviço, busca desconto geral (sem serviço específico)
    if (!discount) {
      discount = agreement.discounts.find(d => 
        !d.serviceId && !d.packageId
      );
    }

    if (!discount) {
      return {
        discountAmount: 0,
        discountPercentage: 0,
        message: 'Nenhum desconto configurado para este serviço',
        agreement: agreement,
      };
    }

    const discountAmount = (amount * Number(discount.discountPercentage)) / 100;

    return {
      discountAmount,
      discountPercentage: Number(discount.discountPercentage),
      message: `Desconto de ${discount.discountPercentage}% aplicado`,
      agreement: agreement,
      discount: discount,
    };
  }

  async calculatePackageDiscount(agreementId: string, packageId: string, amount: number) {
    // Busca o convênio e verifica se está ativo
    const agreement = await this.prisma.agreement.findUnique({
      where: { 
        id: agreementId,
        isActive: true,
      },
      include: {
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
      throw new NotFoundException(`Convênio ativo com ID ${agreementId} não encontrado`);
    }

    // Verifica se o convênio não expirou
    if (agreement.validity && agreement.validity < new Date()) {
      return {
        discountAmount: 0,
        discountPercentage: 0,
        message: 'Convênio expirado',
        agreement: agreement,
      };
    }

    // Busca desconto específico para o pacote
    const discount = agreement.discounts.find(d => 
      d.packageId === packageId
    );

    if (!discount) {
      return {
        discountAmount: 0,
        discountPercentage: 0,
        message: 'Nenhum desconto configurado para este pacote',
        agreement: agreement,
      };
    }

    const discountAmount = (amount * Number(discount.discountPercentage)) / 100;

    return {
      discountAmount,
      discountPercentage: Number(discount.discountPercentage),
      message: `Desconto de ${discount.discountPercentage}% aplicado`,
      agreement: agreement,
      discount: discount,
    };
  }

  async getDiscountStatistics(agreementId: string) {
    const discounts = await this.findByAgreementId(agreementId);
    
    const serviceDiscounts = discounts.filter(d => d.serviceId && !d.packageId);
    const packageDiscounts = discounts.filter(d => d.packageId);
    const generalDiscounts = discounts.filter(d => !d.serviceId && !d.packageId);

    const averageDiscountPercentage = discounts.length > 0 
      ? discounts.reduce((sum, d) => sum + Number(d.discountPercentage), 0) / discounts.length
      : 0;

    return {
      totalDiscounts: discounts.length,
      serviceDiscounts: serviceDiscounts.length,
      packageDiscounts: packageDiscounts.length,
      generalDiscounts: generalDiscounts.length,
      averageDiscountPercentage,
      discounts: discounts,
    };
  }

  async findDiscountsByService(serviceId: string) {
    return this.prisma.agreementDiscount.findMany({
      where: { 
        serviceId,
        isActive: true,
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        service: true,
      },
    });
  }

  async findDiscountsByPackage(packageId: string) {
    return this.prisma.agreementDiscount.findMany({
      where: { 
        packageId,
        isActive: true,
      },
      include: {
        agreement: {
          include: {
            healthPlan: true,
            client: true,
          },
        },
        package: true,
      },
    });
  }
}
