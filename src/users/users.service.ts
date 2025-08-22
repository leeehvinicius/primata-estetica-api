import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BcryptService } from '../common/hash/bcrypt.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private hash: BcryptService) { }

    async create(dto: CreateUserDto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new ConflictException('E-mail já cadastrado');

        const passwordHash = await this.hash.hash(dto.password);
        return this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
                profile: { create: { role: 'RECEPTION' } },
            },
            select: { id: true, email: true, name: true, createdAt: true, profile: true },
        });
    }

    findFullByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    me(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, profile: true, createdAt: true },
        });
    }
}
