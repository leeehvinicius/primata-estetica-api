import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { CreateStockMovementDto } from './dto/stock-movement.dto';
import { CreateProductCategoryDto } from './dto/create-category.dto';
import { UpdateProductCategoryDto } from './dto/update-category.dto';
import { ListProductCategoriesDto } from './dto/list-categories.dto';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) {}

    // ===== CATEGORIAS DE PRODUTO =====
    async createCategory(dto: CreateProductCategoryDto, userId: string) {
        // Verificar duplicidade por nome (case-insensitive)
        const existing = await (this.prisma as any).productCategory.findFirst({
            where: { name: { equals: dto.name, mode: 'insensitive' } }
        });
        if (existing) {
            throw new ConflictException('Já existe uma categoria com este nome');
        }

        const category = await (this.prisma as any).productCategory.create({
            data: {
                name: dto.name,
                description: dto.description,
                isActive: dto.isActive ?? true,
                createdBy: userId,
            }
        });
        return category;
    }

    async listCategories(query: ListProductCategoriesDto) {
        const { page = 1, limit = 10, name, isActive, sortBy = 'name', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (name) where.name = { contains: name, mode: 'insensitive' };
        if (isActive !== undefined) where.isActive = isActive;

        const allowedSortFields = ['name', 'createdAt', 'updatedAt', 'isActive'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        const orderBy: any = {}; orderBy[validSortBy] = sortOrder;

        const [categories, total] = await Promise.all([
            (this.prisma as any).productCategory.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    _count: { select: { products: true } }
                }
            }),
            (this.prisma as any).productCategory.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        return {
            categories: categories.map((c: any) => ({ ...c, productCount: c._count?.products ?? 0 })),
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    async getCategory(id: string) {
        const category = await (this.prisma as any).productCategory.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } }
        });
        if (!category) throw new NotFoundException('Categoria não encontrada');
        return { ...category, productCount: category._count?.products ?? 0 };
    }

    async updateCategory(id: string, dto: UpdateProductCategoryDto) {
        const existing = await (this.prisma as any).productCategory.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Categoria não encontrada');

        if (dto.name && dto.name.toLowerCase() !== existing.name.toLowerCase()) {
            const nameTaken = await (this.prisma as any).productCategory.findFirst({
                where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } }
            });
            if (nameTaken) throw new ConflictException('Já existe uma categoria com este nome');
        }

        const updated = await (this.prisma as any).productCategory.update({
            where: { id },
            data: {
                name: dto.name ?? existing.name,
                description: dto.description ?? existing.description,
                isActive: dto.isActive ?? existing.isActive,
            },
            include: { _count: { select: { products: true } } }
        });
        return { ...updated, productCount: updated._count?.products ?? 0 };
    }

    async removeCategory(id: string) {
        const existing = await (this.prisma as any).productCategory.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Categoria não encontrada');

        // Verificar se há produtos vinculados
        const count = await (this.prisma as any).product.count({ where: { categoryId: id } });
        if (count > 0) {
            throw new BadRequestException('Não é possível deletar categoria com produtos vinculados');
        }

        await (this.prisma as any).productCategory.delete({ where: { id } });
        return { message: 'Categoria deletada com sucesso' };
    }

    async toggleCategoryStatus(id: string) {
        const existing = await (this.prisma as any).productCategory.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Categoria não encontrada');
        const updated = await (this.prisma as any).productCategory.update({
            where: { id },
            data: { isActive: !existing.isActive }
        });
        return updated;
    }

    // ===== PRODUTOS =====
    async createProduct(dto: CreateProductDto, userId: string) {
        // Verificar se a categoria existe
        const category = await (this.prisma as any).productCategory.findUnique({
            where: { id: dto.categoryId }
        });
        if (!category) {
            throw new NotFoundException('Categoria não encontrada');
        }

        // Verificar se o fornecedor existe (se fornecido)
        if (dto.supplierId) {
            const supplier = await (this.prisma as any).supplier.findUnique({
                where: { id: dto.supplierId }
            });
            if (!supplier) {
                throw new NotFoundException('Fornecedor não encontrado');
            }
        }

        // Verificar se SKU já existe
        if (dto.sku) {
            const existingProduct = await (this.prisma as any).product.findUnique({
                where: { sku: dto.sku }
            });
            if (existingProduct) {
                throw new ConflictException('SKU já existe');
            }
        }

        // Verificar se código de barras já existe
        if (dto.barcode) {
            const existingProduct = await (this.prisma as any).product.findUnique({
                where: { barcode: dto.barcode }
            });
            if (existingProduct) {
                throw new ConflictException('Código de barras já existe');
            }
        }

        const productData: any = {
            name: dto.name,
            categoryId: dto.categoryId,
            unit: dto.unit,
            currentStock: 0,
            minStock: dto.minStock || 0,
            costPrice: dto.costPrice,
            salePrice: dto.salePrice,
            requiresPrescription: dto.requiresPrescription || false,
            createdBy: userId,
        };

        if (dto.description) productData.description = dto.description;
        if (dto.supplierId) productData.supplierId = dto.supplierId;
        if (dto.sku) productData.sku = dto.sku;
        if (dto.barcode) productData.barcode = dto.barcode;
        if (dto.maxStock) productData.maxStock = dto.maxStock;
        if (dto.expirationDate) productData.expirationDate = new Date(dto.expirationDate);
        if (dto.location) productData.location = dto.location;
        if (dto.notes) productData.notes = dto.notes;

        const product = await (this.prisma as any).product.create({
            data: productData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    }
                },
            }
        });

        return product;
    }

    async findAllProducts(query: ListProductsDto) {
        const { page = 1, limit = 10, name, sku, barcode, categoryId, supplierId, unit, isActive, lowStock, expiringSoon, requiresPrescription, minPrice, maxPrice, sortBy = 'name', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {};

        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }

        if (sku) {
            where.sku = { contains: sku, mode: 'insensitive' };
        }

        if (barcode) {
            where.barcode = { contains: barcode, mode: 'insensitive' };
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (unit) {
            where.unit = unit;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (requiresPrescription !== undefined) {
            where.requiresPrescription = requiresPrescription;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.salePrice = {};
            if (minPrice !== undefined) where.salePrice.gte = minPrice;
            if (maxPrice !== undefined) where.salePrice.lte = maxPrice;
        }

        // Filtros especiais
        if (lowStock) {
            where.currentStock = { lte: where.minStock || 0 };
        }

        if (expiringSoon) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            where.expirationDate = { lte: thirtyDaysFromNow, gte: new Date() };
        }

        // Validar campo de ordenação
        const allowedSortFields = ['name', 'currentStock', 'salePrice', 'costPrice', 'createdAt', 'updatedAt'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';

        // Construir ordenação
        const orderBy: any = {};
        orderBy[validSortBy] = sortOrder;

        const [products, total] = await Promise.all([
            (this.prisma as any).product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        }
                    },
                }
            }),
            (this.prisma as any).product.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            products,
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    async findOneProduct(id: string) {
        const product = await (this.prisma as any).product.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    }
                },
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        contactPerson: true,
                    }
                },
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                alerts: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                }
            }
        });

        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }

        return product;
    }

    async updateProduct(id: string, dto: UpdateProductDto) {
        // Verificar se o produto existe
        const existingProduct = await (this.prisma as any).product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            throw new NotFoundException('Produto não encontrado');
        }

        // Verificar se a categoria existe (se fornecida)
        if (dto.categoryId) {
            const category = await (this.prisma as any).productCategory.findUnique({
                where: { id: dto.categoryId }
            });
            if (!category) {
                throw new NotFoundException('Categoria não encontrada');
            }
        }

        // Verificar se o fornecedor existe (se fornecido)
        if (dto.supplierId) {
            const supplier = await (this.prisma as any).supplier.findUnique({
                where: { id: dto.supplierId }
            });
            if (!supplier) {
                throw new NotFoundException('Fornecedor não encontrado');
            }
        }

        // Verificar se SKU já existe (se alterado)
        if (dto.sku && dto.sku !== existingProduct.sku) {
            const existingProductWithSku = await (this.prisma as any).product.findUnique({
                where: { sku: dto.sku }
            });
            if (existingProductWithSku) {
                throw new ConflictException('SKU já existe');
            }
        }

        // Verificar se código de barras já existe (se alterado)
        if (dto.barcode && dto.barcode !== existingProduct.barcode) {
            const existingProductWithBarcode = await (this.prisma as any).product.findUnique({
                where: { barcode: dto.barcode }
            });
            if (existingProductWithBarcode) {
                throw new ConflictException('Código de barras já existe');
            }
        }

        const updateData: any = {};

        // Adicionar campos que foram fornecidos
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
        if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;
        if (dto.sku !== undefined) updateData.sku = dto.sku;
        if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
        if (dto.unit !== undefined) updateData.unit = dto.unit;
        if (dto.minStock !== undefined) updateData.minStock = dto.minStock;
        if (dto.maxStock !== undefined) updateData.maxStock = dto.maxStock;
        if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice;
        if (dto.salePrice !== undefined) updateData.salePrice = dto.salePrice;
        if (dto.requiresPrescription !== undefined) updateData.requiresPrescription = dto.requiresPrescription;
        if (dto.expirationDate !== undefined) updateData.expirationDate = new Date(dto.expirationDate);
        if (dto.location !== undefined) updateData.location = dto.location;
        if (dto.notes !== undefined) updateData.notes = dto.notes;

        return (this.prisma as any).product.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    }
                },
            }
        });
    }

    async removeProduct(id: string) {
        // Verificar se o produto existe
        const existingProduct = await (this.prisma as any).product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            throw new NotFoundException('Produto não encontrado');
        }

        await (this.prisma as any).product.delete({ where: { id } });
        return { message: 'Produto deletado com sucesso' };
    }

    // ===== MOVIMENTAÇÕES DE ESTOQUE =====
    async createStockMovement(dto: CreateStockMovementDto, userId: string) {
        // Verificar se o produto existe
        const product = await (this.prisma as any).product.findUnique({
            where: { id: dto.productId }
        });

        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }

        const previousStock = product.currentStock;
        let newStock = previousStock;

        // Calcular novo estoque baseado no tipo de movimentação
        switch (dto.movementType) {
            case 'IN':
            case 'ADJUSTMENT':
                newStock += dto.quantity;
                break;
            case 'OUT':
            case 'LOSS':
            case 'EXPIRATION':
                if (previousStock < dto.quantity) {
                    throw new BadRequestException('Estoque insuficiente para saída');
                }
                newStock -= dto.quantity;
                break;
            case 'TRANSFER':
                // Transferência não altera o estoque total, apenas movimenta
                break;
        }

        // Calcular custo unitário se não fornecido
        const unitCost = dto.unitCost || product.costPrice;
        const totalCost = unitCost * dto.quantity;

        const movement = await (this.prisma as any).stockMovement.create({
            data: {
                productId: dto.productId,
                movementType: dto.movementType,
                quantity: dto.quantity,
                previousStock,
                currentStock: newStock,
                unitCost,
                totalCost,
                reference: dto.reference,
                notes: dto.notes,
                createdBy: userId,
            }
        });

        // Atualizar estoque do produto
        await (this.prisma as any).product.update({
            where: { id: dto.productId },
            data: { currentStock: newStock }
        });

        // Verificar se precisa criar alertas
        await this.checkAndCreateAlerts(dto.productId, newStock, product, userId);

        return movement;
    }

    async getStockMovements(productId?: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (productId) {
            where.productId = productId;
        }

        const [movements, total] = await Promise.all([
            (this.prisma as any).stockMovement.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                        }
                    },
                }
            }),
            (this.prisma as any).stockMovement.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            movements,
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    // ===== ALERTAS DE ESTOQUE =====
    private async checkAndCreateAlerts(productId: string, currentStock: number, product: any, userId: string) {
        const alerts: any[] = [];

        // Verificar estoque baixo
        if (currentStock <= product.minStock && currentStock > 0) {
            alerts.push({
                productId,
                alertType: 'LOW_STOCK',
                message: `Produto ${product.name} com estoque baixo (${currentStock} ${product.unit})`,
                createdBy: userId,
            });
        }

        // Verificar sem estoque
        if (currentStock === 0) {
            alerts.push({
                productId,
                alertType: 'OUT_OF_STOCK',
                message: `Produto ${product.name} sem estoque`,
                createdBy: userId,
            });
        }

        // Verificar vencimento (se tiver data de validade)
        if (product.expirationDate) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const expirationDate = new Date(product.expirationDate);

            if (expirationDate <= thirtyDaysFromNow && expirationDate >= new Date()) {
                alerts.push({
                    productId,
                    alertType: 'EXPIRING_SOON',
                    message: `Produto ${product.name} vencendo em ${expirationDate.toLocaleDateString()}`,
                    createdBy: userId,
                });
            }

            if (expirationDate < new Date()) {
                alerts.push({
                    productId,
                    alertType: 'EXPIRED',
                    message: `Produto ${product.name} vencido em ${expirationDate.toLocaleDateString()}`,
                    createdBy: userId,
                });
            }
        }

        // Verificar estoque excessivo
        if (product.maxStock && currentStock > product.maxStock) {
            alerts.push({
                productId,
                alertType: 'OVERSTOCK',
                message: `Produto ${product.name} com estoque excessivo (${currentStock} ${product.unit})`,
                createdBy: userId,
            });
        }

        // Criar alertas
        for (const alert of alerts) {
            await (this.prisma as any).stockAlert.create({
                data: alert
            });
        }
    }

    async getStockAlerts(isActive = true) {
        return (this.prisma as any).stockAlert.findMany({
            where: { isActive },
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        currentStock: true,
                        unit: true,
                    }
                },
            }
        });
    }

    async resolveAlert(alertId: string, notes?: string) {
        const alert = await (this.prisma as any).stockAlert.findUnique({
            where: { id: alertId }
        });

        if (!alert) {
            throw new NotFoundException('Alerta não encontrado');
        }

        return (this.prisma as any).stockAlert.update({
            where: { id: alertId },
            data: {
                isActive: false,
                resolvedAt: new Date(),
                notes,
            }
        });
    }

    // ===== ESTATÍSTICAS =====
    async getStockStats() {
        const [
            totalProducts,
            activeProducts,
            lowStockProducts,
            outOfStockProducts,
            expiringSoonProducts,
            expiredProducts,
            totalStockValue,
            byCategory,
            byUnit
        ] = await Promise.all([
            (this.prisma as any).product.count(),
            (this.prisma as any).product.count({ where: { isActive: true } }),
            (this.prisma as any).product.count({
                where: {
                    currentStock: { 
                        lte: { minStock: true },
                        gt: 0 
                    }
                }
            }),
            (this.prisma as any).product.count({ where: { currentStock: 0 } }),
            (this.prisma as any).product.count({
                where: {
                    expirationDate: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
                        gte: new Date()
                    }
                }
            }),
            (this.prisma as any).product.count({
                where: {
                    expirationDate: { lt: new Date() }
                }
            }),
            (this.prisma as any).product.aggregate({
                _sum: {
                    currentStock: true,
                    costPrice: true
                }
            }),
            (this.prisma as any).product.groupBy({
                by: ['categoryId'],
                _count: { categoryId: true },
                _sum: { currentStock: true }
            }),
            (this.prisma as any).product.groupBy({
                by: ['unit'],
                _count: { unit: true }
            })
        ]);

        const totalValue = totalStockValue._sum.currentStock * (totalStockValue._sum.costPrice || 0);
        const averageValue = totalProducts > 0 ? totalValue / totalProducts : 0;

        const categoryStats: any = {};
        byCategory.forEach((stat: any) => {
            categoryStats[stat.categoryId] = stat._count.categoryId;
        });

        const unitStats: any = {};
        byUnit.forEach((stat: any) => {
            unitStats[stat.unit] = stat._count.unit;
        });

        return {
            totalProducts,
            activeProducts,
            lowStockProducts,
            outOfStockProducts,
            expiringSoonProducts,
            expiredProducts,
            totalStockValue: totalValue,
            averageStockValue: averageValue,
            byCategory: categoryStats,
            byUnit: unitStats,
        };
    }

    // ===== CONSUMO POR SERVIÇO =====
    async consumeProductsForService(serviceId: string, userId: string) {
        // Buscar produtos necessários para o serviço
        const serviceProducts = await (this.prisma as any).serviceProduct.findMany({
            where: { serviceId },
            include: {
                product: true
            }
        });

        const movements: any[] = [];

        for (const serviceProduct of serviceProducts) {
            const { product, quantity } = serviceProduct;

            if (product.currentStock < quantity) {
                throw new BadRequestException(`Estoque insuficiente para ${product.name}`);
            }

            // Criar movimentação de saída
            const movement = await this.createStockMovement({
                productId: product.id,
                movementType: 'OUT',
                quantity: quantity,
                reference: `Serviço ${serviceId}`,
                notes: 'Consumo automático por serviço',
            }, userId);

            movements.push(movement);
        }

        return movements;
    }
}
