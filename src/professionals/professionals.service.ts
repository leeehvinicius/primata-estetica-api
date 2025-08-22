import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ListProfessionalsDto } from './dto/list-professionals.dto';

@Injectable()
export class ProfessionalsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateProfessionalDto) {
        // Verificar se já existe profissional com email ou documento
        if (dto.email) {
            const existingEmail = await (this.prisma as any).professional.findUnique({ 
                where: { email: dto.email } 
            });
            if (existingEmail) {
                throw new ConflictException('Email já cadastrado');
            }
        }

        if (dto.document) {
            const existingDocument = await (this.prisma as any).professional.findUnique({ 
                where: { document: dto.document } 
            });
            if (existingDocument) {
                throw new ConflictException('CPF já cadastrado');
            }
        }

        const professionalData: any = {
            name: dto.name,
            phone: dto.phone,
            specialty: dto.specialty,
            isActive: dto.isActive ?? true,
        };

        // Adicionar campos opcionais se fornecidos
        if (dto.email) professionalData.email = dto.email;
        if (dto.license) professionalData.license = dto.license;
        if (dto.document) professionalData.document = dto.document;
        if (dto.birthDate) professionalData.birthDate = new Date(dto.birthDate);
        if (dto.gender) professionalData.gender = dto.gender;
        if (dto.address) professionalData.address = dto.address;
        if (dto.city) professionalData.city = dto.city;
        if (dto.state) professionalData.state = dto.state;
        if (dto.zipCode) professionalData.zipCode = dto.zipCode;
        if (dto.emergencyContact) professionalData.emergencyContact = dto.emergencyContact;
        if (dto.emergencyPhone) professionalData.emergencyPhone = dto.emergencyPhone;
        if (dto.hireDate) professionalData.hireDate = new Date(dto.hireDate);
        if (dto.salary) professionalData.salary = dto.salary;
        if (dto.notes) professionalData.notes = dto.notes;

        return (this.prisma as any).professional.create({
            data: professionalData,
        });
    }

    async findAll(query: ListProfessionalsDto) {
        const { page = 1, limit = 10, search, specialty, gender, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { specialty: { contains: search, mode: 'insensitive' } },
                { document: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (specialty) {
            where.specialty = { contains: specialty, mode: 'insensitive' };
        }

        if (gender) {
            where.gender = gender;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Validar campo de ordenação
        const allowedSortFields = ['name', 'email', 'phone', 'specialty', 'createdAt', 'updatedAt'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

        // Construir ordenação
        const orderBy: any = {};
        orderBy[validSortBy] = sortOrder;

        const [professionals, total] = await Promise.all([
            (this.prisma as any).professional.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            (this.prisma as any).professional.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            professionals,
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    async findOne(id: string) {
        const professional = await (this.prisma as any).professional.findUnique({
            where: { id },
            include: {
                schedules: {
                    orderBy: { dayOfWeek: 'asc' },
                },
                services: {
                    orderBy: { serviceName: 'asc' },
                },
            },
        });

        if (!professional) {
            throw new NotFoundException('Profissional não encontrado');
        }

        return professional;
    }

    async update(id: string, dto: UpdateProfessionalDto) {
        // Verificar se o profissional existe
        const existingProfessional = await (this.prisma as any).professional.findUnique({
            where: { id }
        });

        if (!existingProfessional) {
            throw new NotFoundException('Profissional não encontrado');
        }

        // Verificar se email já existe (se estiver sendo alterado)
        if (dto.email && dto.email !== existingProfessional.email) {
            const emailExists = await (this.prisma as any).professional.findUnique({ 
                where: { email: dto.email } 
            });
            if (emailExists) {
                throw new ConflictException('Email já cadastrado');
            }
        }

        // Verificar se documento já existe (se estiver sendo alterado)
        if (dto.document && dto.document !== existingProfessional.document) {
            const documentExists = await (this.prisma as any).professional.findUnique({ 
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
        if (dto.specialty !== undefined) updateData.specialty = dto.specialty;
        if (dto.license !== undefined) updateData.license = dto.license;
        if (dto.document !== undefined) updateData.document = dto.document;
        if (dto.birthDate !== undefined) updateData.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
        if (dto.gender !== undefined) updateData.gender = dto.gender;
        if (dto.address !== undefined) updateData.address = dto.address;
        if (dto.city !== undefined) updateData.city = dto.city;
        if (dto.state !== undefined) updateData.state = dto.state;
        if (dto.zipCode !== undefined) updateData.zipCode = dto.zipCode;
        if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact;
        if (dto.emergencyPhone !== undefined) updateData.emergencyPhone = dto.emergencyPhone;
        if (dto.hireDate !== undefined) updateData.hireDate = dto.hireDate ? new Date(dto.hireDate) : null;
        if (dto.salary !== undefined) updateData.salary = dto.salary;
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

        return (this.prisma as any).professional.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        // Verificar se o profissional existe
        const existingProfessional = await (this.prisma as any).professional.findUnique({
            where: { id }
        });

        if (!existingProfessional) {
            throw new NotFoundException('Profissional não encontrado');
        }

        await (this.prisma as any).professional.delete({ where: { id } });
        return { message: 'Profissional deletado com sucesso' };
    }

    async toggleStatus(id: string) {
        const professional = await (this.prisma as any).professional.findUnique({
            where: { id }
        });

        if (!professional) {
            throw new NotFoundException('Profissional não encontrado');
        }

        return (this.prisma as any).professional.update({
            where: { id },
            data: { isActive: !professional.isActive },
        });
    }

    async getStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [total, active, inactive, byGender, bySpecialty, newThisMonth, newThisYear] = await Promise.all([
            (this.prisma as any).professional.count(),
            (this.prisma as any).professional.count({ where: { isActive: true } }),
            (this.prisma as any).professional.count({ where: { isActive: false } }),
            (this.prisma as any).professional.groupBy({
                by: ['gender'],
                _count: { gender: true }
            }),
            (this.prisma as any).professional.groupBy({
                by: ['specialty'],
                _count: { specialty: true }
            }),
            (this.prisma as any).professional.count({
                where: { createdAt: { gte: startOfMonth } }
            }),
            (this.prisma as any).professional.count({
                where: { createdAt: { gte: startOfYear } }
            })
        ]);

        const genderStats: any = {
            MALE: 0,
            FEMALE: 0,
            OTHER: 0,
            PREFER_NOT_TO_SAY: 0,
        };

        byGender.forEach((stat: any) => {
            if (stat.gender) {
                genderStats[stat.gender] = stat._count.gender;
            }
        });

        const specialtyStats: Record<string, number> = {};
        bySpecialty.forEach((stat: any) => {
            specialtyStats[stat.specialty] = stat._count.specialty;
        });

        return {
            total,
            active,
            inactive,
            byGender: genderStats,
            bySpecialty: specialtyStats,
            newThisMonth,
            newThisYear,
        };
    }

    async searchByName(name: string) {
        return (this.prisma as any).professional.findMany({
            where: {
                name: { contains: name, mode: 'insensitive' }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                specialty: true,
            },
            take: 10,
        });
    }

    async searchBySpecialty(specialty: string) {
        return (this.prisma as any).professional.findMany({
            where: {
                specialty: { contains: specialty, mode: 'insensitive' },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                specialty: true,
            },
            take: 10,
        });
    }

    async getAvailableProfessionals(date: Date) {
        const dayOfWeek = this.getDayOfWeek(date);
        
        return (this.prisma as any).professional.findMany({
            where: {
                isActive: true,
                schedules: {
                    some: {
                        dayOfWeek,
                        isActive: true,
                    }
                }
            },
            include: {
                schedules: {
                    where: {
                        dayOfWeek,
                        isActive: true,
                    }
                },
                services: {
                    where: {
                        isActive: true,
                    }
                },
            },
        });
    }

    private getDayOfWeek(date: Date): string {
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[date.getDay()];
    }
}
