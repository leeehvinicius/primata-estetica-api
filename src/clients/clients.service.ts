import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { Gender } from '@prisma/client';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateClientDto) {
        // Verificar se já existe cliente com email ou documento
        if (dto.email) {
            const existingEmail = await this.prisma.client.findUnique({ 
                where: { email: dto.email } 
            });
            if (existingEmail) {
                throw new ConflictException('Email já cadastrado');
            }
        }

        if (dto.document) {
            const existingDocument = await this.prisma.client.findUnique({ 
                where: { document: dto.document } 
            });
            if (existingDocument) {
                throw new ConflictException('CPF já cadastrado');
            }
        }

        const clientData: any = {
            name: dto.name,
            phone: dto.phone,
            isActive: dto.isActive ?? true,
        };

        // Adicionar campos opcionais se fornecidos
        if (dto.email) clientData.email = dto.email;
        if (dto.birthDate) clientData.birthDate = new Date(dto.birthDate);
        if (dto.gender) clientData.gender = dto.gender;
        if (dto.document) clientData.document = dto.document;
        if (dto.address) clientData.address = dto.address;
        if (dto.city) clientData.city = dto.city;
        if (dto.state) clientData.state = dto.state;
        if (dto.zipCode) clientData.zipCode = dto.zipCode;
        if (dto.emergencyContact) clientData.emergencyContact = dto.emergencyContact;
        if (dto.emergencyPhone) clientData.emergencyPhone = dto.emergencyPhone;
        if (dto.notes) clientData.notes = dto.notes;
        if (dto.termsAccepted !== undefined) clientData.termsAccepted = dto.termsAccepted;
        if (dto.termsAcceptedAt) clientData.termsAcceptedAt = new Date(dto.termsAcceptedAt);

        return this.prisma.client.create({
            data: clientData,
        });
    }

    async findAll(query: ListClientsDto) {
        const { page = 1, limit = 10, search, gender, isActive, termsAccepted, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { document: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (gender) {
            where.gender = gender;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (termsAccepted !== undefined) {
            where.termsAccepted = termsAccepted;
        }

        // Validar campo de ordenação
        const allowedSortFields = ['name', 'email', 'phone', 'createdAt', 'updatedAt'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

        // Construir ordenação
        const orderBy: any = {};
        orderBy[validSortBy] = sortOrder;

        const [clients, total] = await Promise.all([
            this.prisma.client.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.client.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            clients,
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    async findOne(id: string) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                preferences: true,
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 10, // Últimos 10 atendimentos
                },
                medicalHistory: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
                treatments: {
                    orderBy: { startDate: 'desc' },
                    take: 5, // Últimos 5 tratamentos
                },
            },
        });

        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }

        return client;
    }

    async update(id: string, dto: UpdateClientDto) {
        // Verificar se o cliente existe
        const existingClient = await this.prisma.client.findUnique({
            where: { id }
        });

        if (!existingClient) {
            throw new NotFoundException('Cliente não encontrado');
        }

        // Verificar se email já existe (se estiver sendo alterado)
        if (dto.email && dto.email !== existingClient.email) {
            const emailExists = await this.prisma.client.findUnique({ 
                where: { email: dto.email } 
            });
            if (emailExists) {
                throw new ConflictException('Email já cadastrado');
            }
        }

        // Verificar se documento já existe (se estiver sendo alterado)
        if (dto.document && dto.document !== existingClient.document) {
            const documentExists = await this.prisma.client.findUnique({ 
                where: { document: dto.document } 
            });
            if (documentExists) {
                throw new ConflictException('CPF já cadastrado');
            }
        }

        const updateData: any = {};

        // Adicionar campos que foram fornecidos
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.email !== undefined) updateData.email = dto.email;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.birthDate !== undefined) updateData.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
        if (dto.gender !== undefined) updateData.gender = dto.gender;
        if (dto.document !== undefined) updateData.document = dto.document;
        if (dto.address !== undefined) updateData.address = dto.address;
        if (dto.city !== undefined) updateData.city = dto.city;
        if (dto.state !== undefined) updateData.state = dto.state;
        if (dto.zipCode !== undefined) updateData.zipCode = dto.zipCode;
        if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact;
        if (dto.emergencyPhone !== undefined) updateData.emergencyPhone = dto.emergencyPhone;
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.termsAccepted !== undefined) updateData.termsAccepted = dto.termsAccepted;
        if (dto.termsAcceptedAt !== undefined) updateData.termsAcceptedAt = dto.termsAcceptedAt ? new Date(dto.termsAcceptedAt) : null;
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

        return this.prisma.client.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        // Verificar se o cliente existe
        const existingClient = await this.prisma.client.findUnique({
            where: { id }
        });

        if (!existingClient) {
            throw new NotFoundException('Cliente não encontrado');
        }

        await this.prisma.client.delete({ where: { id } });
        return { message: 'Cliente deletado com sucesso' };
    }

    async toggleStatus(id: string) {
        const client = await this.prisma.client.findUnique({
            where: { id }
        });

        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }

        return this.prisma.client.update({
            where: { id },
            data: { isActive: !client.isActive },
        });
    }

    async getStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [total, active, inactive, byGender, newThisMonth, newThisYear] = await Promise.all([
            this.prisma.client.count(),
            this.prisma.client.count({ where: { isActive: true } }),
            this.prisma.client.count({ where: { isActive: false } }),
            this.prisma.client.groupBy({
                by: ['gender'],
                _count: { gender: true }
            }),
            this.prisma.client.count({
                where: { createdAt: { gte: startOfMonth } }
            }),
            this.prisma.client.count({
                where: { createdAt: { gte: startOfYear } }
            })
        ]);

        const genderStats: Record<Gender, number> = {
            MALE: 0,
            FEMALE: 0,
            OTHER: 0,
            PREFER_NOT_TO_SAY: 0,
        };

        byGender.forEach(stat => {
            if (stat.gender) {
                genderStats[stat.gender] = stat._count.gender;
            }
        });

        return {
            total,
            active,
            inactive,
            byGender: genderStats,
            newThisMonth,
            newThisYear,
        };
    }

    async searchByName(name: string) {
        return this.prisma.client.findMany({
            where: {
                name: { contains: name, mode: 'insensitive' }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
            take: 10,
        });
    }

    async getClientHistory(id: string) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                attendances: {
                    orderBy: { date: 'desc' },
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                medicalHistory: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                treatments: {
                    orderBy: { startDate: 'desc' },
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
            },
        });

        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }

        return client;
    }

    async acceptTerms(id: string) {
        const client = await this.prisma.client.findUnique({
            where: { id }
        });

        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }

        return this.prisma.client.update({
            where: { id },
            data: {
                termsAccepted: true,
                termsAcceptedAt: new Date(),
            },
        });
    }
}
