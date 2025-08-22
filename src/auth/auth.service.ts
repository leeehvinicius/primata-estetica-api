import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BcryptService } from '../common/hash/bcrypt.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private users: UsersService,
        private jwt: JwtService,
        private config: ConfigService,
        private hash: BcryptService,
    ) { }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ 
            where: { email: dto.email },
            include: { profile: true }
        });
        if (!user) throw new UnauthorizedException('Credenciais inválidas');

        // Verificar se o usuário tem perfil e está ativo
        if (!user.profile || !user.profile.isActive) {
            throw new UnauthorizedException('Usuário inativo ou sem perfil');
        }

        const ok = await this.hash.compare(dto.password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        // Atualizar último login
        await this.users.updateLastLogin(user.id);

        const tokens = await this.signTokens(user.id, user.email, user.profile.role);
        await this.saveRefresh(user.id, tokens.refresh_token);
        return tokens;
    }

    async refresh(userId: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({ 
            where: { id: userId },
            include: { profile: true }
        });
        
        if (!user || !user.refreshTokenHash) throw new ForbiddenException('Acesso negado');

        // Verificar se o usuário tem perfil e está ativo
        if (!user.profile || !user.profile.isActive) {
            throw new ForbiddenException('Usuário inativo ou sem perfil');
        }

        const ok = await this.hash.compare(refreshToken, user.refreshTokenHash);
        if (!ok) throw new ForbiddenException('Acesso negado');

        const tokens = await this.signTokens(user.id, user.email, user.profile.role);
        await this.saveRefresh(user.id, tokens.refresh_token);
        return tokens;
    }

    async logout(userId: string) {
        await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
        return { success: true };
    }

    private async signTokens(sub: string, email: string, role: string) {
        const [at, rt] = await Promise.all([
            this.jwt.signAsync({ sub, email, role }, {
                secret: this.config.get('JWT_ACCESS_SECRET'),
                expiresIn: this.config.get('JWT_ACCESS_EXPIRES'),
            }),
            this.jwt.signAsync({ sub, email, role }, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES'),
            }),
        ]);
        return { access_token: at, refresh_token: rt };
    }

    private async saveRefresh(userId: string, rt: string) {
        const hash = await this.hash.hash(rt);
        await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: hash } });
    }
}
