import { ConflictException, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { BcryptService } from '../common/hash/bcrypt.service';
import { Role } from '@prisma/client';
import { getRoleDescription } from '../common/constants/permissions';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private hash: BcryptService) { }

    async create(dto: CreateUserDto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new ConflictException('E-mail já cadastrado');

        const passwordHash = await this.hash.hash(dto.password);
        const role = dto.role || 'RECEPCIONISTA';

        return this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
                profile: { 
                    create: { 
                        role,
                        phone: dto.phone,
                        document: dto.document,
                    } 
                },
            },
            select: { 
                id: true, 
                email: true, 
                name: true, 
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true,
                        role: true,
                        phone: true,
                        document: true,
                        isActive: true,
                        lastLogin: true,
                    }
                } 
            },
        });
    }

    async findAll(query: ListUsersDto) {
        const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {
            profile: {}
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { phone: { contains: search, mode: 'insensitive' } } },
                { profile: { document: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (role) {
            where.profile.role = role;
        }

        if (isActive !== undefined) {
            where.profile.isActive = isActive;
        }

        // Validar campo de ordenação
        const allowedSortFields = ['name', 'email', 'createdAt', 'updatedAt'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

        // Construir ordenação
        const orderBy: any = {};
        if (validSortBy === 'name' || validSortBy === 'email') {
            orderBy[validSortBy] = sortOrder;
        } else {
            orderBy[validSortBy] = sortOrder;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: { 
                    id: true, 
                    email: true, 
                    name: true, 
                    createdAt: true,
                    updatedAt: true,
                    profile: {
                        select: {
                            id: true,
                            role: true,
                            phone: true,
                            document: true,
                            isActive: true,
                            lastLogin: true,
                        }
                    } 
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            users,
            total,
            page,
            limit,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { 
                id: true, 
                email: true, 
                name: true, 
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true,
                        role: true,
                        phone: true,
                        document: true,
                        isActive: true,
                        lastLogin: true,
                    }
                } 
            },
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return user;
    }

    async update(id: string, dto: UpdateUserDto, currentUserRole: Role) {
        // Verificar se o usuário existe
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });

        if (!existingUser) {
            throw new NotFoundException('Usuário não encontrado');
        }

        // Verificar permissões para alterar role
        if (dto.role && dto.role !== existingUser.profile?.role) {
            if (currentUserRole !== 'ADMINISTRADOR') {
                throw new ForbiddenException('Apenas administradores podem alterar roles de usuários');
            }
        }

        // Verificar se o email já existe (se estiver sendo alterado)
        if (dto.email && dto.email !== existingUser.email) {
            const emailExists = await this.prisma.user.findUnique({ 
                where: { email: dto.email } 
            });
            if (emailExists) {
                throw new ConflictException('E-mail já cadastrado');
            }
        }

        // Preparar dados para atualização
        const userData: any = {};
        const profileData: any = {};

        if (dto.name) userData.name = dto.name;
        if (dto.email) userData.email = dto.email;
        if (dto.role) profileData.role = dto.role;
        if (dto.phone !== undefined) profileData.phone = dto.phone;
        if (dto.document !== undefined) profileData.document = dto.document;
        if (dto.isActive !== undefined) profileData.isActive = dto.isActive;

        // Atualizar usuário e perfil
        return this.prisma.user.update({
            where: { id },
            data: {
                ...userData,
                profile: {
                    update: profileData
                }
            },
            select: { 
                id: true, 
                email: true, 
                name: true, 
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true,
                        role: true,
                        phone: true,
                        document: true,
                        isActive: true,
                        lastLogin: true,
                    }
                } 
            },
        });
    }

    async remove(id: string, currentUserRole: Role) {
        // Verificar se o usuário existe
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });

        if (!existingUser) {
            throw new NotFoundException('Usuário não encontrado');
        }

        // Apenas administradores podem deletar usuários
        if (currentUserRole !== 'ADMINISTRADOR') {
            throw new ForbiddenException('Apenas administradores podem deletar usuários');
        }

        // Não permitir que um administrador se delete
        if (existingUser.profile?.role === 'ADMINISTRADOR') {
            throw new ForbiddenException('Não é possível deletar um administrador');
        }

        await this.prisma.user.delete({ where: { id } });
        return { message: 'Usuário deletado com sucesso' };
    }

    async updateLastLogin(id: string) {
        await this.prisma.profile.update({
            where: { userId: id },
            data: { lastLogin: new Date() }
        });
    }

    async getStats() {
        const [total, active, inactive, byRole] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({
                where: { profile: { isActive: true } }
            }),
            this.prisma.user.count({
                where: { profile: { isActive: false } }
            }),
            this.prisma.profile.groupBy({
                by: ['role'],
                _count: { role: true }
            })
        ]);

        const roleStats: Record<Role, number> = {
            ADMINISTRADOR: 0,
            MEDICO: 0,
            RECEPCIONISTA: 0,
            SERVICOS_GERAIS: 0,
        };

        byRole.forEach(stat => {
            roleStats[stat.role] = stat._count.role;
        });

        return {
            total,
            active,
            inactive,
            byRole: roleStats,
        };
    }

    async toggleUserStatus(id: string, currentUserRole: Role) {
        if (currentUserRole !== 'ADMINISTRADOR') {
            throw new ForbiddenException('Apenas administradores podem alterar o status de usuários');
        }

        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (user.profile?.role === 'ADMINISTRADOR') {
            throw new ForbiddenException('Não é possível desativar um administrador');
        }

        const newStatus = !user.profile?.isActive;

        return this.prisma.user.update({
            where: { id },
            data: {
                profile: {
                    update: { isActive: newStatus }
                }
            },
            select: { 
                id: true, 
                email: true, 
                name: true, 
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true,
                        role: true,
                        phone: true,
                        document: true,
                        isActive: true,
                        lastLogin: true,
                    }
                } 
            },
        });
    }

    findFullByEmail(email: string) {
        return this.prisma.user.findUnique({ 
            where: { email },
            include: { profile: true }
        });
    }

    me(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { 
                id: true, 
                email: true, 
                name: true, 
                profile: {
                    select: {
                        id: true,
                        role: true,
                        phone: true,
                        document: true,
                        isActive: true,
                        lastLogin: true,
                    }
                }, 
                createdAt: true,
                updatedAt: true
            },
        });
    }

    async getRoleInfo(role: Role) {
        return {
            role,
            description: getRoleDescription(role),
        };
    }

    async getRoles() {
        const roles = Object.values(Role);
        return roles.map(role => ({
            role,
            description: getRoleDescription(role),
        }));
    }
}
