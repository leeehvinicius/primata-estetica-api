import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesDto } from './dto/list-services.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateServiceDto, userId: string) {
    // Verificar se já existe serviço com o mesmo nome
    const existingService = await (this.prisma as any).service.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        isActive: true,
      },
    });
    if (existingService) {
      throw new ConflictException('Serviço com este nome já existe');
    }

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
          'Usuário não encontrado para criar o serviço',
        );
      }
    }

    // Validar e obter categoria
    let serviceCategoryId: string;
    
    if (dto.serviceCategoryId) {
      // Se serviceCategoryId foi fornecido, usar diretamente
      serviceCategoryId = dto.serviceCategoryId;
    } else if (dto.category) {
      // Se category (nome) foi fornecido, buscar pelo nome
      const categoryByName = await (this.prisma as any).serviceCategory.findFirst({
        where: { 
          name: { equals: dto.category, mode: 'insensitive' },
          isActive: true
        },
      });
      if (!categoryByName) {
        throw new NotFoundException(
          `Categoria de serviço com nome "${dto.category}" não encontrada`
        );
      }
      serviceCategoryId = categoryByName.id;
    } else {
      throw new BadRequestException(
        'É necessário fornecer serviceCategoryId ou category'
      );
    }

    // Validar que a categoria existe
    const category = await (this.prisma as any).serviceCategory.findUnique({
      where: { id: serviceCategoryId },
    });
    if (!category) {
      throw new NotFoundException('Categoria de serviço não encontrada');
    }

    const serviceData: any = {
      name: dto.name,
      serviceCategoryId: serviceCategoryId,
      duration: dto.duration,
      basePrice: dto.basePrice,
      currentPrice: dto.currentPrice,
      requiresProfessional: dto.requiresProfessional ?? true,
      maxConcurrentClients: dto.maxConcurrentClients ?? 1,
      isActive: dto.isActive ?? true,
      createdBy: createdBy,
    };

    // Adicionar campos opcionais se fornecidos
    if (dto.description) serviceData.description = dto.description;
    if (dto.preparationTime) serviceData.preparationTime = dto.preparationTime;
    if (dto.recoveryTime) serviceData.recoveryTime = dto.recoveryTime;
    if (dto.contraindications)
      serviceData.contraindications = dto.contraindications;
    if (dto.benefits) serviceData.benefits = dto.benefits;
    if (dto.notes) serviceData.notes = dto.notes;
    if (dto.color) serviceData.color = dto.color;

    return (this.prisma as any).service.create({
      data: serviceData,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: ListServicesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      serviceCategoryId,
      isActive,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (serviceCategoryId) {
      where.serviceCategoryId = serviceCategoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.currentPrice = {};
      if (minPrice !== undefined) where.currentPrice.gte = minPrice;
      if (maxPrice !== undefined) where.currentPrice.lte = maxPrice;
    }

    // Validar campo de ordenação
    const allowedSortFields = [
      'name',
      'currentPrice',
      'duration',
      'createdAt',
      'updatedAt',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    // Construir ordenação
    const orderBy: any = {};
    orderBy[validSortBy] = sortOrder;

    const [services, total] = await Promise.all([
      (this.prisma as any).service.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { category: { select: { id: true, name: true } } },
      }),
      (this.prisma as any).service.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      services,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  async findOne(id: string) {
    const service = await (this.prisma as any).service.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    // Verificar se o serviço existe
    const existingService = await (this.prisma as any).service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Verificar se nome já existe (se estiver sendo alterado)
    if (dto.name && dto.name !== existingService.name) {
      const nameExists = await (this.prisma as any).service.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          isActive: true,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new ConflictException('Serviço com este nome já existe');
      }
    }

    const updateData: any = {};

    // Adicionar campos que foram fornecidos
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.serviceCategoryId !== undefined) {
      const category = await (this.prisma as any).serviceCategory.findUnique({
        where: { id: dto.serviceCategoryId },
      });
      if (!category)
        throw new NotFoundException('Categoria de serviço não encontrada');
      updateData.serviceCategoryId = dto.serviceCategoryId;
    }
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.basePrice !== undefined) updateData.basePrice = dto.basePrice;
    if (dto.currentPrice !== undefined)
      updateData.currentPrice = dto.currentPrice;
    if (dto.requiresProfessional !== undefined)
      updateData.requiresProfessional = dto.requiresProfessional;
    if (dto.maxConcurrentClients !== undefined)
      updateData.maxConcurrentClients = dto.maxConcurrentClients;
    if (dto.preparationTime !== undefined)
      updateData.preparationTime = dto.preparationTime;
    if (dto.recoveryTime !== undefined)
      updateData.recoveryTime = dto.recoveryTime;
    if (dto.contraindications !== undefined)
      updateData.contraindications = dto.contraindications;
    if (dto.benefits !== undefined) updateData.benefits = dto.benefits;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return (this.prisma as any).service.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    // Verificar se o serviço existe
    const existingService = await (this.prisma as any).service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço não encontrado');
    }

    await (this.prisma as any).service.delete({ where: { id } });
    return { message: 'Serviço deletado com sucesso' };
  }

  async toggleStatus(id: string) {
    const service = await (this.prisma as any).service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return (this.prisma as any).service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [total, active, inactive, byCategory, newThisMonth, newThisYear] =
      await Promise.all([
        (this.prisma as any).service.count(),
        (this.prisma as any).service.count({ where: { isActive: true } }),
        (this.prisma as any).service.count({ where: { isActive: false } }),
        (this.prisma as any).service.groupBy({
          by: ['serviceCategoryId'],
          _count: { serviceCategoryId: true },
        }),
        (this.prisma as any).service.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
        (this.prisma as any).service.count({
          where: { createdAt: { gte: startOfYear } },
        }),
      ]);

    // Calcular preço médio
    const priceStats = await (this.prisma as any).service.aggregate({
      where: { isActive: true },
      _avg: { currentPrice: true },
      _sum: { currentPrice: true },
    });

    const categoryStats: any = {};
    byCategory.forEach((stat: any) => {
      categoryStats[stat.serviceCategoryId] = stat._count.serviceCategoryId;
    });

    return {
      total,
      active,
      inactive,
      byCategory: categoryStats,
      averagePrice: priceStats._avg.currentPrice || 0,
      totalRevenue: priceStats._sum.currentPrice || 0,
      newThisMonth,
      newThisYear,
    };
  }

  async searchByName(name: string) {
    return (this.prisma as any).service.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        serviceCategoryId: true,
        currentPrice: true,
        duration: true,
      },
      take: 10,
    });
  }

  async searchByCategory(serviceCategoryId: string) {
    return (this.prisma as any).service.findMany({
      where: {
        serviceCategoryId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        serviceCategoryId: true,
        currentPrice: true,
        duration: true,
      },
      take: 10,
    });
  }

  async getServicesByPriceRange(minPrice: number, maxPrice: number) {
    return (this.prisma as any).service.findMany({
      where: {
        currentPrice: {
          gte: minPrice,
          lte: maxPrice,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        serviceCategoryId: true,
        currentPrice: true,
        duration: true,
      },
      orderBy: { currentPrice: 'asc' },
    });
  }

  async getServicesByDuration(maxDuration: number) {
    return (this.prisma as any).service.findMany({
      where: {
        duration: {
          lte: maxDuration,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        serviceCategoryId: true,
        currentPrice: true,
        duration: true,
      },
      orderBy: { duration: 'asc' },
    });
  }

  // ===== CATEGORIAS DE SERVIÇO =====
  async createServiceCategory(dto: any, userId: string) {
    const existing = await (this.prisma as any).serviceCategory.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing)
      throw new ConflictException(
        'Já existe uma categoria de serviço com este nome',
      );
    return (this.prisma as any).serviceCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
    });
  }

  async listServiceCategories(query: any) {
    const {
      page = 1,
      limit = 10,
      name,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive;
    const allowed = ['name', 'createdAt', 'updatedAt', 'isActive'];
    const validSortBy = allowed.includes(sortBy) ? sortBy : 'name';
    const orderBy: any = {};
    orderBy[validSortBy] = sortOrder;

    const [items, total] = await Promise.all([
      (this.prisma as any).serviceCategory.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { _count: { select: { services: true } } },
      }),
      (this.prisma as any).serviceCategory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      categories: items.map((c: any) => ({
        ...c,
        serviceCount: c._count?.services ?? 0,
      })),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getServiceCategory(id: string) {
    const cat = await (this.prisma as any).serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } },
    });
    if (!cat)
      throw new NotFoundException('Categoria de serviço não encontrada');
    return { ...cat, serviceCount: cat._count?.services ?? 0 };
  }

  async updateServiceCategory(id: string, dto: any) {
    const existing = await (this.prisma as any).serviceCategory.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Categoria de serviço não encontrada');
    if (dto.name && dto.name.toLowerCase() !== existing.name.toLowerCase()) {
      const nameTaken = await (this.prisma as any).serviceCategory.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
      });
      if (nameTaken)
        throw new ConflictException(
          'Já existe uma categoria de serviço com este nome',
        );
    }
    return (this.prisma as any).serviceCategory.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
  }

  async removeServiceCategory(id: string) {
    const existing = await (this.prisma as any).serviceCategory.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Categoria de serviço não encontrada');
    const count = await (this.prisma as any).service.count({
      where: { serviceCategoryId: id },
    });
    if (count > 0)
      throw new ConflictException(
        'Não é possível deletar categoria com serviços vinculados',
      );
    await (this.prisma as any).serviceCategory.delete({ where: { id } });
    return { message: 'Categoria deletada com sucesso' };
  }

  async toggleServiceCategoryStatus(id: string) {
    const existing = await (this.prisma as any).serviceCategory.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Categoria de serviço não encontrada');
    return (this.prisma as any).serviceCategory.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }
}
