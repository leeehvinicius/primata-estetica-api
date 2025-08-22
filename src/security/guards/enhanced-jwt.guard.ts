import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SecurityService } from '../security.service';

@Injectable()
export class EnhancedJwtGuard extends AuthGuard('jwt') {
    constructor(private securityService: SecurityService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        
        // Primeiro, executar a validação JWT padrão
        const canActivate = await super.canActivate(context);
        if (!canActivate) {
            return false;
        }

        const user = (request as any).user;
        if (!user) {
            return false;
        }

        // Extrair token do header Authorization
        const authHeader = request.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token de acesso inválido');
        }

        const token = authHeader.substring(7);

        // Validar sessão
        const session = await this.securityService.validateSession(token);
        if (!session) {
            await this.securityService.logSecurityEvent({
                userId: user.id,
                eventType: 'UNAUTHORIZED_ACCESS',
                severity: 'HIGH',
                description: 'Tentativa de acesso com token inválido ou sessão expirada',
                ipAddress: this.securityService.extractRequestInfo(request).ipAddress,
                userAgent: request.get('User-Agent'),
                metadata: { userId: user.id, endpoint: request.url }
            });

            throw new UnauthorizedException('Sessão inválida ou expirada');
        }

        // Verificar se o usuário está ativo
        if (!session.user.profile || !session.user.profile.isActive) {
            await this.securityService.logSecurityEvent({
                userId: user.id,
                sessionId: session.id,
                eventType: 'UNAUTHORIZED_ACCESS',
                severity: 'HIGH',
                description: 'Tentativa de acesso com usuário inativo',
                ipAddress: this.securityService.extractRequestInfo(request).ipAddress,
                userAgent: request.get('User-Agent'),
                metadata: { userId: user.id, isActive: session.user.profile?.isActive }
            });

            throw new ForbiddenException('Usuário inativo');
        }

        // Verificar atividade suspeita de IP
        await this.checkSuspiciousActivity(request, session);

        // Atualizar atividade da sessão
        await this.securityService.updateSessionActivity(session.id);

        // Adicionar informações da sessão ao request
        (request as any).sessionId = session.id;
        (request as any).sessionInfo = {
            id: session.id,
            loginMethod: session.loginMethod,
            ipAddress: session.ipAddress,
            trusted: session.trusted,
            deviceFingerprint: session.deviceFingerprint
        };

        return true;
    }

    private async checkSuspiciousActivity(request: Request, session: any) {
        const currentIP = this.securityService.extractRequestInfo(request).ipAddress;
        const sessionIP = session.ipAddress;

        // Verificar se o IP mudou
        if (currentIP !== sessionIP) {
            await this.securityService.logSecurityEvent({
                userId: session.userId,
                sessionId: session.id,
                eventType: 'SUSPICIOUS_ACTIVITY',
                severity: 'MEDIUM',
                description: `Mudança de IP detectada na sessão. IP original: ${sessionIP}, IP atual: ${currentIP}`,
                ipAddress: currentIP,
                userAgent: request.get('User-Agent'),
                metadata: {
                    originalIP: sessionIP,
                    currentIP,
                    sessionId: session.id
                }
            });

            // Se o dispositivo não for confiável, invalidar sessão
            if (!session.trusted) {
                await this.securityService.terminateSession(session.id);
                throw new UnauthorizedException('Sessão invalidada por atividade suspeita');
            }
        }

        // Verificar múltiplas sessões concorrentes
        const activeSessions = await this.countActiveSessions(session.userId);
        if (activeSessions > 5) { // Máximo de 5 sessões ativas
            await this.securityService.logSecurityEvent({
                userId: session.userId,
                sessionId: session.id,
                eventType: 'CONCURRENT_SESSIONS',
                severity: 'MEDIUM',
                description: `Usuário com ${activeSessions} sessões ativas simultâneas`,
                ipAddress: currentIP,
                userAgent: request.get('User-Agent'),
                metadata: { activeSessionCount: activeSessions }
            });
        }
    }

    private async countActiveSessions(userId: string): Promise<number> {
        return await (this.securityService as any).prisma.userSession.count({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() }
            }
        });
    }
}
