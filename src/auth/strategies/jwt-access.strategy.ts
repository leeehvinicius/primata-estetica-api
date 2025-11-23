import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Payload:', payload);

    // Buscar o usuário com perfil no banco
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      console.log('JWT Strategy - User not found or no profile');
      return null; // Isso vai causar um erro 401
    }

    const result = {
      id: user.id,
      sub: user.id,
      email: user.email,
      profile: user.profile,
    };

    console.log('JWT Strategy - Returning:', result);
    return result;
  }
}
