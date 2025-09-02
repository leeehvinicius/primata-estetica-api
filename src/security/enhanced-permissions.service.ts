import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from './security.service';
import {
    EnhancedPermission,
    SecurityAction,
    SecurityResource,
    PermissionScope,
    DataClassification,
    ENHANCED_ROLE_PERMISSIONS,
    PermissionCheckDto,
    PermissionResult
} from './dto/enhanced-permissions.dto';
import { Role, SecurityEventType, SecuritySeverity } from '@prisma/client';

@Injectable()
export class EnhancedPermissionsService {
    private readonly logger = new Logger(EnhancedPermissionsService.name);

    constructor(
        private prisma: PrismaService,
        private securityService: SecurityService
    ) {}

    // ===== VERIFICAÇÃO DE PERMISSÕES =====
    
    async checkPermission(dto: PermissionCheckDto): Promise<PermissionResult> {
        try {
            // Buscar usuário e role
            const user = await this.prisma.user.findUnique({
                where: { id: dto.userId },
                include: { profile: true }
            });

            if (!user || !user.profile) {
                return {
                    allowed: false,
                    reason: 'Usuário não encontrado ou sem perfil'
                };
            }

            const userRole = user.profile.role as Role;
            
            // Buscar permissões do role
            const rolePermissions = ENHANCED_ROLE_PERMISSIONS[userRole];
            if (!rolePermissions) {
                return {
                    allowed: false,
                    reason: 'Role não possui permissões definidas'
                };
            }

            // Encontrar permissão específica para o recurso
            const permission = rolePermissions.find(p => p.resource === dto.resource);
            if (!permission) {
                return {
                    allowed: false,
                    reason: `Acesso negado ao recurso ${dto.resource}`
                };
            }

            // Verificar se a ação é permitida
            if (!permission.actions.includes(dto.action)) {
                return {
                    allowed: false,
                    reason: `Ação ${dto.action} não permitida para o recurso ${dto.resource}`
                };
            }

            // Verificar escopo
            const scopeCheck = await this.checkScope(permission, dto, user);
            if (!scopeCheck.allowed) {
                return scopeCheck;
            }

            // Verificar condições específicas
            const conditionCheck = await this.checkConditions(permission, dto, user);
            if (!conditionCheck.allowed) {
                return conditionCheck;
            }

            // Verificar restrições
            const restrictionCheck = await this.checkRestrictions(permission, dto, user);
            if (!restrictionCheck.allowed) {
                return restrictionCheck;
            }

            // Verificar restrições de tempo
            const timeCheck = this.checkTimeRestrictions(permission);
            if (!timeCheck.allowed) {
                return timeCheck;
            }

            // Log da verificação de permissão
            await this.securityService.logAction({
                userId: dto.userId,
                action: 'SYSTEM_ACCESS',
                resource: 'permissions',
                method: 'POST',
                endpoint: '/security/permissions/check',
                ipAddress: '127.0.0.1',
                success: true,
                metadata: {
                    resource: dto.resource,
                    action: dto.action,
                    allowed: true,
                    scope: permission.scope,
                    dataClassification: permission.dataClassification
                }
            });

            return {
                allowed: true,
                reason: 'Permissão concedida',
                scope: permission.scope,
                dataClassification: permission.dataClassification,
                conditions: permission.conditions,
                restrictions: permission.restrictions
            };

        } catch (error) {
            this.logger.error('Erro ao verificar permissão', error);
            return {
                allowed: false,
                reason: 'Erro interno na verificação de permissão'
            };
        }
    }

    // ===== VERIFICAÇÕES ESPECÍFICAS =====
    
    private async checkScope(
        permission: EnhancedPermission,
        dto: PermissionCheckDto,
        user: any
    ): Promise<PermissionResult> {
        switch (permission.scope) {
            case PermissionScope.GLOBAL:
                return { allowed: true, reason: 'Acesso global' };

            case PermissionScope.SELF:
                if (dto.resourceId && dto.resourceId !== user.id) {
                    return {
                        allowed: false,
                        reason: 'Acesso permitido apenas aos próprios dados'
                    };
                }
                return { allowed: true, reason: 'Acesso aos próprios dados' };

            case PermissionScope.DEPARTMENT:
                // Implementar lógica de departamento
                return { allowed: true, reason: 'Acesso departamental' };

            case PermissionScope.ASSIGNED:
                const assignmentCheck = await this.checkAssignment(dto, user);
                return assignmentCheck;

            case PermissionScope.READONLY:
                if (dto.action !== SecurityAction.READ) {
                    return {
                        allowed: false,
                        reason: 'Escopo permite apenas leitura'
                    };
                }
                return { allowed: true, reason: 'Acesso somente leitura' };

            case PermissionScope.LIMITED:
                return { allowed: true, reason: 'Acesso limitado' };

            default:
                return {
                    allowed: false,
                    reason: 'Escopo não reconhecido'
                };
        }
    }

    private async checkAssignment(dto: PermissionCheckDto, user: any): Promise<PermissionResult> {
        // Verificar se o usuário está atribuído ao recurso
        switch (dto.resource) {
            case SecurityResource.APPOINTMENTS:
                if (dto.resourceId) {
                    const appointment = await (this.prisma as any).appointment.findUnique({
                        where: { id: dto.resourceId }
                    });
                    
                    if (appointment && appointment.professionalId === user.id) {
                        return { allowed: true, reason: 'Agendamento atribuído ao profissional' };
                    }
                }
                return {
                    allowed: false,
                    reason: 'Agendamento não atribuído ao usuário'
                };

            case SecurityResource.CLIENTS:
                // Implementar lógica de atribuição de clientes
                return { allowed: true, reason: 'Cliente atribuído' };

            default:
                return { allowed: true, reason: 'Recurso atribuído' };
        }
    }

    private async checkConditions(
        permission: EnhancedPermission,
        dto: PermissionCheckDto,
        user: any
    ): Promise<PermissionResult> {
        if (!permission.conditions || permission.conditions.length === 0) {
            return { allowed: true, reason: 'Sem condições específicas' };
        }

        for (const condition of permission.conditions) {
            const conditionResult = await this.evaluateCondition(condition, dto, user);
            if (!conditionResult.allowed) {
                return conditionResult;
            }
        }

        return { allowed: true, reason: 'Todas as condições atendidas' };
    }

    private async evaluateCondition(
        condition: string,
        dto: PermissionCheckDto,
        user: any
    ): Promise<PermissionResult> {
        switch (condition) {
            case 'patient_assigned':
                // Verificar se o paciente está atribuído ao médico
                if (dto.resourceId) {
                    const assignment = await this.checkPatientAssignment(dto.resourceId, user.id);
                    return assignment
                        ? { allowed: true, reason: 'Paciente atribuído' }
                        : { allowed: false, reason: 'Paciente não atribuído ao médico' };
                }
                return { allowed: true, reason: 'Sem ID específico para verificar' };

            case 'active_treatment':
                // Verificar se há tratamento ativo
                if (dto.resourceId) {
                    const activeTreatment = await this.checkActiveTreatment(dto.resourceId, user.id);
                    return activeTreatment
                        ? { allowed: true, reason: 'Tratamento ativo encontrado' }
                        : { allowed: false, reason: 'Sem tratamento ativo' };
                }
                return { allowed: true, reason: 'Sem ID específico para verificar' };

            case 'professional_assigned':
                // Verificar se o profissional está atribuído
                if (dto.resourceId) {
                    const assignment = await this.checkProfessionalAssignment(dto.resourceId, user.id);
                    return assignment
                        ? { allowed: true, reason: 'Profissional atribuído' }
                        : { allowed: false, reason: 'Profissional não atribuído' };
                }
                return { allowed: true, reason: 'Sem ID específico para verificar' };

            case 'cleaning_products_only':
                // Verificar se são apenas produtos de limpeza
                if (dto.resourceId) {
                    const isCleaningProduct = await this.checkCleaningProduct(dto.resourceId);
                    return isCleaningProduct
                        ? { allowed: true, reason: 'Produto de limpeza' }
                        : { allowed: false, reason: 'Acesso apenas a produtos de limpeza' };
                }
                return { allowed: true, reason: 'Sem ID específico para verificar' };

            default:
                this.logger.warn(`Condição não reconhecida: ${condition}`);
                return { allowed: true, reason: 'Condição não implementada' };
        }
    }

    private async checkRestrictions(
        permission: EnhancedPermission,
        dto: PermissionCheckDto,
        user: any
    ): Promise<PermissionResult> {
        if (!permission.restrictions || permission.restrictions.length === 0) {
            return { allowed: true, reason: 'Sem restrições' };
        }

        for (const restriction of permission.restrictions) {
            const restrictionResult = await this.evaluateRestriction(restriction, dto, user);
            if (!restrictionResult.allowed) {
                return restrictionResult;
            }
        }

        return { allowed: true, reason: 'Todas as restrições atendidas' };
    }

    private async evaluateRestriction(
        restriction: string,
        dto: PermissionCheckDto,
        user: any
    ): Promise<PermissionResult> {
        switch (restriction) {
            case 'no_diagnosis':
                // Não permitir acesso a diagnósticos
                if (dto.context && dto.context.field === 'diagnosis') {
                    return {
                        allowed: false,
                        reason: 'Acesso a diagnósticos não permitido'
                    };
                }
                return { allowed: true, reason: 'Sem acesso a diagnósticos' };

            case 'no_treatment_details':
                // Não permitir acesso a detalhes de tratamento
                if (dto.context && dto.context.field === 'treatment_details') {
                    return {
                        allowed: false,
                        reason: 'Acesso a detalhes de tratamento não permitido'
                    };
                }
                return { allowed: true, reason: 'Sem acesso a detalhes de tratamento' };

            case 'basic_reports_only':
                // Permitir apenas relatórios básicos
                if (dto.context && dto.context.reportType && !this.isBasicReport(dto.context.reportType)) {
                    return {
                        allowed: false,
                        reason: 'Acesso apenas a relatórios básicos'
                    };
                }
                return { allowed: true, reason: 'Relatório básico permitido' };

            default:
                this.logger.warn(`Restrição não reconhecida: ${restriction}`);
                return { allowed: true, reason: 'Restrição não implementada' };
        }
    }

    private checkTimeRestrictions(permission: EnhancedPermission): PermissionResult {
        if (!permission.timeRestriction) {
            return { allowed: true, reason: 'Sem restrições de horário' };
        }

        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        // Parse time restriction (formato: "09:00-18:00")
        const match = permission.timeRestriction.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
        if (!match) {
            return { allowed: true, reason: 'Formato de restrição de horário inválido' };
        }

        const startTime = parseInt(match[1]) * 100 + parseInt(match[2]);
        const endTime = parseInt(match[3]) * 100 + parseInt(match[4]);

        if (currentTime >= startTime && currentTime <= endTime) {
            return { allowed: true, reason: 'Dentro do horário permitido' };
        }

        return {
            allowed: false,
            reason: `Acesso permitido apenas entre ${permission.timeRestriction}`
        };
    }

    // ===== MÉTODOS AUXILIARES =====
    
    private async checkPatientAssignment(clientId: string, professionalId: string): Promise<boolean> {
        const assignment = await (this.prisma as any).appointment.findFirst({
            where: {
                clientId,
                professionalId,
                status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
            }
        });
        return !!assignment;
    }

    private async checkActiveTreatment(clientId: string, professionalId: string): Promise<boolean> {
        const treatment = await (this.prisma as any).treatment.findFirst({
            where: {
                clientId,
                createdBy: professionalId,
                status: 'ACTIVE'
            }
        });
        return !!treatment;
    }

    private async checkProfessionalAssignment(appointmentId: string, professionalId: string): Promise<boolean> {
        const appointment = await (this.prisma as any).appointment.findUnique({
            where: { id: appointmentId }
        });
        return appointment?.professionalId === professionalId;
    }

    private async checkCleaningProduct(productId: string): Promise<boolean> {
        const product = await (this.prisma as any).product.findUnique({
            where: { id: productId },
            include: { category: true }
        });
        return product?.category?.name?.toLowerCase().includes('limpeza') || false;
    }

    private isBasicReport(reportType: string): boolean {
        const basicReports = ['daily_appointments', 'weekly_summary', 'client_list'];
        return basicReports.includes(reportType);
    }

    // ===== GESTÃO DE PERMISSÕES =====
    
    async getUserPermissions(userId: string): Promise<EnhancedPermission[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user || !user.profile) {
            return [];
        }

        return ENHANCED_ROLE_PERMISSIONS[user.profile.role as Role] || [];
    }

    async hasPermission(
        userId: string,
        resource: SecurityResource,
        action: SecurityAction,
        resourceId?: string,
        context?: any
    ): Promise<boolean> {
        const result = await this.checkPermission({
            userId,
            resource,
            action,
            resourceId,
            context
        });
        return result.allowed;
    }

    // ===== AUDITORIA DE PERMISSÕES =====
    
    async auditPermissionUsage(
        userId: string,
        resource: SecurityResource,
        action: SecurityAction,
        allowed: boolean,
        reason: string
    ): Promise<void> {
        await this.securityService.logAction({
            userId,
            action: 'ADMIN_ACTION',
            resource: 'permissions',
            method: 'POST',
            endpoint: '/security/permissions/audit',
            ipAddress: '127.0.0.1',
            success: allowed,
            metadata: {
                targetResource: resource,
                targetAction: action,
                allowed,
                reason
            }
        });

        // Se a permissão foi negada, criar evento de segurança
        if (!allowed) {
            await this.securityService.logSecurityEvent({
                userId,
                eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
                severity: SecuritySeverity.MEDIUM,
                description: `Tentativa de acesso negado: ${action} em ${resource}`,
                ipAddress: '127.0.0.1',
                metadata: {
                    resource,
                    action,
                    reason
                }
            });
        }
    }
}
