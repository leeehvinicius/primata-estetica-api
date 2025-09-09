import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private prisma: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: any) {
        console.log('JWT Strategy - Payload:', payload);
        
        // Buscar o usuário com perfil no banco
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { profile: true }
        });

        if (!user || !user.profile) {
            console.log('JWT Strategy - User not found or no profile');
            return null; // Isso vai causar um erro 401
        }

        const result = {
            id: user.id,
            sub: user.id,
            email: user.email,
            profile: user.profile
        };
        
        console.log('JWT Strategy - Returning:', result);
        return result;
    }
}
