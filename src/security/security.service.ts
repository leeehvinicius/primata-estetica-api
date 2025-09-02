import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import * as crypto from 'crypto';
import * as geoip from 'geoip-lite';
import { AuditAction, AuditSeverity, SecuritySeverity, SecurityEventType, LoginMethod, SecurityConfigCategory } from '@prisma/client';

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);

    constructor(private prisma: PrismaService) {}

    // ===== AUDITORIA =====
    async logAction(params: {
        userId?: string;
        sessionId?: string;
        action: AuditAction;
        resource: string;
        resourceId?: string;
        method: string;
        endpoint: string;
        ipAddress: string;
        userAgent?: string;
        oldValues?: any;
        newValues?: any;
        metadata?: any;
        severity?: AuditSeverity;
        success: boolean;
        errorMessage?: string;
        duration?: number;
    }) {
        try {
            await (this.prisma as any).auditLog.create({
                data: {
                    userId: params.userId,
                    sessionId: params.sessionId,
                    action: params.action,
                    resource: params.resource,
                    resourceId: params.resourceId,
                    method: params.method,
                    endpoint: params.endpoint,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
                    newValues: params.newValues ? JSON.stringify(params.newValues) : null,
                    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
                    severity: params.severity || AuditSeverity.INFO,
                    success: params.success,
                    errorMessage: params.errorMessage,
                    duration: params.duration,
                }
            });
        } catch (error) {
            this.logger.error('Failed to log audit action', error);
        }
    }

    // ===== EVENTOS DE SEGURANÇA =====
    async logSecurityEvent(params: {
        userId?: string;
        sessionId?: string;
        eventType: SecurityEventType;
        severity?: SecuritySeverity;
        description: string;
        ipAddress: string;
        userAgent?: string;
        metadata?: any;
    }) {
        try {
            const location = this.getLocationFromIP(params.ipAddress);

            await (this.prisma as any).securityEvent.create({
                data: {
                    userId: params.userId,
                    sessionId: params.sessionId,
                    eventType: params.eventType,
                    severity: params.severity || SecuritySeverity.MEDIUM,
                    description: params.description,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    location: location ? JSON.stringify(location) : null,
                    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
                }
            });

            // Log crítico para o sistema
            if (params.severity === SecuritySeverity.CRITICAL || params.severity === SecuritySeverity.HIGH) {
                this.logger.error(`SECURITY EVENT: ${params.eventType} - ${params.description}`, {
                    userId: params.userId,
                    ipAddress: params.ipAddress,
                    metadata: params.metadata
                });
            }
        } catch (error) {
            this.logger.error('Failed to log security event', error);
        }
    }

    // ===== GERENCIAMENTO DE SESSÕES =====
    async createSession(params: {
        userId: string;
        sessionToken: string;
        refreshToken?: string;
        ipAddress: string;
        userAgent?: string;
        loginMethod?: LoginMethod;
        expiresAt: Date;
    }) {
        const sessionTokenHash = this.hashToken(params.sessionToken);
        const refreshTokenHash = params.refreshToken ? this.hashToken(params.refreshToken) : null;
        const location = this.getLocationFromIP(params.ipAddress);
        const deviceFingerprint = this.generateDeviceFingerprint(params.userAgent, params.ipAddress);

        return await (this.prisma as any).userSession.create({
            data: {
                userId: params.userId,
                sessionToken: sessionTokenHash,
                refreshToken: refreshTokenHash,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                location: location ? JSON.stringify(location) : null,
                loginMethod: params.loginMethod || LoginMethod.EMAIL_PASSWORD,
                deviceFingerprint,
                expiresAt: params.expiresAt,
            }
        });
    }

    async validateSession(sessionToken: string): Promise<any> {
        const sessionTokenHash = this.hashToken(sessionToken);

        return await (this.prisma as any).userSession.findFirst({
            where: {
                sessionToken: sessionTokenHash,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
    }

    async updateSessionActivity(sessionId: string) {
        await (this.prisma as any).userSession.update({
            where: { id: sessionId },
            data: { lastActivity: new Date() }
        });
    }

    async terminateSession(sessionId: string, terminatedBy?: string) {
        await (this.prisma as any).userSession.update({
            where: { id: sessionId },
            data: {
                isActive: false,
                terminatedAt: new Date(),
                terminatedBy
            }
        });
    }

    async terminateAllUserSessions(userId: string, exceptSessionId?: string, terminatedBy?: string) {
        const where: any = {
            userId,
            isActive: true
        };

        if (exceptSessionId) {
            where.id = { not: exceptSessionId };
        }

        await (this.prisma as any).userSession.updateMany({
            where,
            data: {
                isActive: false,
                terminatedAt: new Date(),
                terminatedBy
            }
        });
    }

    // ===== TENTATIVAS DE LOGIN =====
    async logLoginAttempt(params: {
        email: string;
        success: boolean;
        ipAddress: string;
        userAgent?: string;
        failureReason?: string;
        userId?: string;
    }) {
        await (this.prisma as any).loginAttempt.create({
            data: {
                email: params.email,
                success: params.success,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                failureReason: params.failureReason,
                userId: params.userId,
            }
        });
    }

    async checkBruteForceAttempts(email: string, ipAddress: string): Promise<{
        isBlocked: boolean;
        attemptCount: number;
        blockTimeRemaining?: number;
    }> {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Contar tentativas falhadas nos últimos 5 minutos
        const [emailAttempts, ipAttempts] = await Promise.all([
            (this.prisma as any).loginAttempt.count({
                where: {
                    email,
                    success: false,
                    createdAt: { gte: fiveMinutesAgo }
                }
            }),
            (this.prisma as any).loginAttempt.count({
                where: {
                    ipAddress,
                    success: false,
                    createdAt: { gte: fiveMinutesAgo }
                }
            })
        ]);

        const maxAttempts = 5;
        const isBlocked = emailAttempts >= maxAttempts || ipAttempts >= maxAttempts;

        if (isBlocked) {
            // Log evento de segurança
            await this.logSecurityEvent({
                eventType: SecurityEventType.BRUTE_FORCE_ATTEMPT,
                severity: SecuritySeverity.HIGH,
                description: `Tentativa de força bruta detectada para ${email} do IP ${ipAddress}`,
                ipAddress,
                metadata: { emailAttempts, ipAttempts }
            });
        }

        return {
            isBlocked,
            attemptCount: Math.max(emailAttempts, ipAttempts),
            blockTimeRemaining: isBlocked ? 5 * 60 * 1000 : undefined
        };
    }

    // ===== HISTÓRICO DE SENHAS =====
    async savePasswordHistory(userId: string, passwordHash: string) {
        // Salvar nova senha no histórico
        await (this.prisma as any).passwordHistory.create({
            data: {
                userId,
                passwordHash
            }
        });

        // Manter apenas as últimas 5 senhas
        const oldPasswords = await (this.prisma as any).passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: 5
        });

        if (oldPasswords.length > 0) {
            await (this.prisma as any).passwordHistory.deleteMany({
                where: {
                    id: { in: oldPasswords.map((p: any) => p.id) }
                }
            });
        }
    }

    async checkPasswordReuse(userId: string, newPasswordHash: string): Promise<boolean> {
        const recentPasswords = await (this.prisma as any).passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return recentPasswords.some((p: any) => p.passwordHash === newPasswordHash);
    }

    // ===== MONITORAMENTO DE API =====
    async logApiUsage(params: {
        userId?: string;
        sessionId?: string;
        endpoint: string;
        method: string;
        ipAddress: string;
        userAgent?: string;
        statusCode: number;
        responseTime: number;
        requestSize?: number;
        responseSize?: number;
        rateLimited?: boolean;
    }) {
        try {
            await (this.prisma as any).apiUsage.create({
                data: {
                    userId: params.userId,
                    sessionId: params.sessionId,
                    endpoint: params.endpoint,
                    method: params.method,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    statusCode: params.statusCode,
                    responseTime: params.responseTime,
                    requestSize: params.requestSize,
                    responseSize: params.responseSize,
                    rateLimited: params.rateLimited || false,
                }
            });
        } catch (error) {
            this.logger.error('Failed to log API usage', error);
        }
    }

    // ===== CONFIGURAÇÕES DE SEGURANÇA =====
    async getSecurityConfig(key: string): Promise<string | null> {
        const config = await (this.prisma as any).securityConfiguration.findUnique({
            where: { key }
        });
        return config?.value || null;
    }

    async setSecurityConfig(key: string, value: string, category: string, updatedBy: string, description?: string, sensitive = false) {
        return await (this.prisma as any).securityConfiguration.upsert({
            where: { key },
            update: {
                value,
                description,
                category,
                sensitive,
                updatedBy
            },
            create: {
                key,
                value,
                description,
                category,
                sensitive,
                updatedBy
            }
        });
    }

    // ===== RELATÓRIOS DE SEGURANÇA =====
    async getSecurityReport(startDate?: Date, endDate?: Date) {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
        const end = endDate || new Date();

        const [
            totalAuditLogs,
            securityEvents,
            loginAttempts,
            activeSessions,
            suspiciousActivities
        ] = await Promise.all([
            (this.prisma as any).auditLog.count({
                where: {
                    createdAt: { gte: start, lte: end }
                }
            }),
            (this.prisma as any).securityEvent.groupBy({
                by: ['eventType', 'severity'],
                where: {
                    createdAt: { gte: start, lte: end }
                },
                _count: { eventType: true }
            }),
            (this.prisma as any).loginAttempt.groupBy({
                by: ['success'],
                where: {
                    createdAt: { gte: start, lte: end }
                },
                _count: { success: true }
            }),
            (this.prisma as any).userSession.count({
                where: { isActive: true }
            }),
            (this.prisma as any).securityEvent.count({
                where: {
                    createdAt: { gte: start, lte: end },
                    severity: { in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] },
                    resolved: false
                }
            })
        ]);

        return {
            period: { start, end },
            totalAuditLogs,
            securityEvents,
            loginAttempts,
            activeSessions,
            suspiciousActivities,
        };
    }

    // ===== MÉTODOS AUXILIARES =====
    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private generateDeviceFingerprint(userAgent?: string, ipAddress?: string): string {
        const data = `${userAgent || 'unknown'}-${ipAddress || 'unknown'}-${Date.now()}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    private getLocationFromIP(ipAddress: string): any {
        try {
            // Skip private IPs
            if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
                return null;
            }

            const geo = geoip.lookup(ipAddress);
            return geo ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                latitude: geo.ll[0],
                longitude: geo.ll[1]
            } : null;
        } catch (error) {
            return null;
        }
    }

    extractRequestInfo(request: Request): {
        ipAddress: string;
        userAgent?: string;
        endpoint: string;
        method: string;
    } {
        return {
            ipAddress: this.getClientIP(request),
            userAgent: request.get('User-Agent'),
            endpoint: request.url,
            method: request.method
        };
    }

    private getClientIP(request: Request): string {
        return (
            request.get('X-Forwarded-For')?.split(',')[0] ||
            request.get('X-Real-IP') ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress ||
            '127.0.0.1'
        );
    }
}
