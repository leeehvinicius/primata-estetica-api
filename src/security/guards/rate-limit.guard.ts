import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityService } from '../security.service';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições na janela
  message?: string; // Mensagem de erro personalizada
  skipSuccessfulRequests?: boolean; // Ignorar requisições bem-sucedidas
  skipFailedRequests?: boolean; // Ignorar requisições falhadas
}

// Decorator para configurar rate limiting
export const RateLimit = (config: RateLimitConfig) =>
  Reflect.metadata('rateLimit', config);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(
    private reflector: Reflector,
    private securityService: SecurityService,
  ) {
    // Limpeza periódica do cache
    setInterval(() => this.cleanupExpiredEntries(), 60000); // A cada minuto
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(
      'rateLimit',
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitConfig) {
      return true; // Sem limite configurado
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);
    const now = Date.now();

    // Obter ou criar entrada para a chave
    let entry = this.requests.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + rateLimitConfig.windowMs,
      };
      this.requests.set(key, entry);
    }

    // Incrementar contador
    entry.count++;

    // Verificar se excedeu o limite
    if (entry.count > rateLimitConfig.maxRequests) {
      const { ipAddress, userAgent } =
        this.securityService.extractRequestInfo(request);
      const user = (request as any).user;

      // Log evento de segurança
      await this.securityService.logSecurityEvent({
        userId: user?.id,
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        description: `Rate limit excedido: ${entry.count} requisições em ${rateLimitConfig.windowMs}ms`,
        ipAddress,
        userAgent,
        metadata: {
          endpoint: request.url,
          method: request.method,
          requestCount: entry.count,
          windowMs: rateLimitConfig.windowMs,
          maxRequests: rateLimitConfig.maxRequests,
        },
      });

      // Log uso da API com flag de rate limited
      await this.securityService.logApiUsage({
        userId: user?.id,
        sessionId: (request as any).sessionId,
        endpoint: request.url,
        method: request.method,
        ipAddress,
        userAgent,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        responseTime: 0,
        rateLimited: true,
      });

      const timeUntilReset = Math.ceil((entry.resetTime - now) / 1000);

      throw new HttpException(
        rateLimitConfig.message ||
          `Muitas requisições. Tente novamente em ${timeUntilReset} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private generateKey(request: Request): string {
    const { ipAddress } = this.securityService.extractRequestInfo(request);
    const user = (request as any).user;
    const endpoint = request.url.split('?')[0]; // Remove query parameters

    // Usar uma combinação de IP, usuário e endpoint para a chave
    return `${ipAddress}:${user?.id || 'anonymous'}:${endpoint}`;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Rate limits pré-configurados
export const StrictRateLimit = RateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10,
  message: 'Muitas tentativas. Tente novamente em 1 minuto.',
});

export const LoginRateLimit = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
});

export const ApiRateLimit = RateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100,
  message:
    'Limite de requisições excedido. Tente novamente em alguns segundos.',
});

export const AdminRateLimit = RateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 50,
  message: 'Limite de operações administrativas excedido.',
});
