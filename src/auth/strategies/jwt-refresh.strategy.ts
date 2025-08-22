import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }
    validate(req: any, payload: any) {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        return { ...payload, refreshToken: token };
    }
}
