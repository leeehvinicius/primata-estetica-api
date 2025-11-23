import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { SecurityService } from '../security.service';
import { AuditAction, AuditSeverity } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private securityService: SecurityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const startTime = Date.now();

    // Extrair informações da requisição
    const { ipAddress, userAgent, endpoint, method } =
      this.securityService.extractRequestInfo(request);

    // Determinar ação baseada no método HTTP
    const action = this.getActionFromMethod(method);

    // Extrair recurso do endpoint
    const resource = this.getResourceFromEndpoint(endpoint);

    // Extrair ID do recurso se disponível
    const resourceId = this.getResourceIdFromRequest(request);

    // Capturar valores antigos para operações de atualização
    let oldValues: any = null;
    if (method === 'PUT' || method === 'PATCH') {
      oldValues = this.captureOldValues(request);
    }

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        const newValues = this.captureNewValues(response, request);

        // Log da auditoria
        await this.securityService.logAction({
          userId: user?.id,
          sessionId: (request as any).sessionId,
          action,
          resource,
          resourceId: resourceId || undefined,
          method,
          endpoint,
          ipAddress,
          userAgent,
          oldValues,
          newValues,
          severity: this.getSeverity(action, resource),
          success: true,
          duration,
        });

        // Log uso da API
        await this.securityService.logApiUsage({
          userId: user?.id,
          sessionId: (request as any).sessionId,
          endpoint,
          method,
          ipAddress,
          userAgent,
          statusCode: 200,
          responseTime: duration,
          requestSize: this.getRequestSize(request),
          responseSize: this.getResponseSize(response),
        });
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;

        // Log da auditoria para erros
        await this.securityService.logAction({
          userId: user?.id,
          sessionId: (request as any).sessionId,
          action,
          resource,
          resourceId: resourceId || undefined,
          method,
          endpoint,
          ipAddress,
          userAgent,
          oldValues,
          severity: AuditSeverity.HIGH,
          success: false,
          errorMessage: error.message,
          duration,
        });

        // Log uso da API para erros
        await this.securityService.logApiUsage({
          userId: user?.id,
          sessionId: (request as any).sessionId,
          endpoint,
          method,
          ipAddress,
          userAgent,
          statusCode: error.status || 500,
          responseTime: duration,
          requestSize: this.getRequestSize(request),
        });

        throw error;
      }),
    );
  }

  private getActionFromMethod(method: string): AuditAction {
    const actionMap: Record<string, AuditAction> = {
      GET: AuditAction.READ,
      POST: AuditAction.CREATE,
      PUT: AuditAction.UPDATE,
      PATCH: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
    };
    return actionMap[method.toUpperCase()] || AuditAction.READ;
  }

  private getResourceFromEndpoint(endpoint: string): string {
    // Remove query parameters
    const path = endpoint.split('?')[0];

    // Extract resource from path (e.g., /api/users/123 -> users)
    const segments = path.split('/').filter((segment) => segment);

    // Skip 'api' if present
    const startIndex = segments[0] === 'api' ? 1 : 0;

    return segments[startIndex] || 'unknown';
  }

  private getResourceIdFromRequest(request: Request): string | null {
    // Try to get ID from URL parameters
    if (request.params && request.params.id) {
      return request.params.id;
    }

    // Try to get ID from other common parameter names
    const idParams = ['id', 'userId', 'clientId', 'appointmentId', 'paymentId'];
    for (const param of idParams) {
      if (request.params && request.params[param]) {
        return request.params[param];
      }
    }

    return null;
  }

  private captureOldValues(request: Request): any {
    // Para operações de atualização, tentamos capturar os valores antigos
    // Isso seria idealmente feito no controller específico
    return null;
  }

  private captureNewValues(response: any, request: Request): any {
    if (
      request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH'
    ) {
      // Para operações de criação/atualização, capturar dados relevantes
      if (response && typeof response === 'object') {
        // Remove campos sensíveis
        const { passwordHash, refreshTokenHash, ...safeResponse } = response;
        return safeResponse;
      }
    }
    return null;
  }

  private getSeverity(action: AuditAction, resource: string): AuditSeverity {
    // Definir severidade baseada na ação e recurso
    if (
      action === AuditAction.DELETE ||
      resource === 'users' ||
      resource === 'security'
    ) {
      return AuditSeverity.HIGH;
    }
    if (
      action === AuditAction.UPDATE &&
      (resource === 'payments' || resource === 'appointments')
    ) {
      return AuditSeverity.MEDIUM;
    }
    return AuditSeverity.INFO;
  }

  private getRequestSize(request: Request): number | undefined {
    try {
      const contentLength = request.get('Content-Length');
      return contentLength ? parseInt(contentLength) : undefined;
    } catch {
      return undefined;
    }
  }

  private getResponseSize(response: any): number | undefined {
    try {
      if (response && typeof response === 'object') {
        return JSON.stringify(response).length;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }
}
