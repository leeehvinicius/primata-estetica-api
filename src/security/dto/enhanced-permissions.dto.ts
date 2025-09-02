import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export enum SecurityAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    EXECUTE = 'execute',
    APPROVE = 'approve',
    EXPORT = 'export',
    IMPORT = 'import',
    AUDIT = 'audit',
    MONITOR = 'monitor'
}

export enum SecurityResource {
    // Usuários e Perfis
    USERS = 'users',
    PROFILES = 'profiles',
    ROLES = 'roles',
    
    // Clientes e Médicos
    CLIENTS = 'clients',
    CLIENT_PREFERENCES = 'client_preferences',
    MEDICAL_HISTORY = 'medical_history',
    TREATMENTS = 'treatments',
    ATTENDANCES = 'attendances',
    
    // Profissionais
    PROFESSIONALS = 'professionals',
    PROFESSIONAL_SCHEDULES = 'professional_schedules',
    PROFESSIONAL_SERVICES = 'professional_services',
    
    // Serviços
    SERVICES = 'services',
    SERVICE_PACKAGES = 'service_packages',
    SERVICE_PROMOTIONS = 'service_promotions',
    SERVICE_PRODUCTS = 'service_products',
    
    // Agendamentos
    APPOINTMENTS = 'appointments',
    APPOINTMENT_REMINDERS = 'appointment_reminders',
    
    // Pagamentos
    PAYMENTS = 'payments',
    PAYMENT_RECEIPTS = 'payment_receipts',
    COMMISSIONS = 'commissions',
    
    // Estoque
    PRODUCTS = 'products',
    PRODUCT_CATEGORIES = 'product_categories',
    SUPPLIERS = 'suppliers',
    STOCK_MOVEMENTS = 'stock_movements',
    STOCK_ALERTS = 'stock_alerts',
    
    // Relatórios e Analytics
    REPORTS = 'reports',
    ANALYTICS = 'analytics',
    DASHBOARD = 'dashboard',
    
    // Segurança
    SECURITY_EVENTS = 'security_events',
    AUDIT_LOGS = 'audit_logs',
    USER_SESSIONS = 'user_sessions',
    SECURITY_CONFIG = 'security_config',
    BACKUP = 'backup',
    ENCRYPTION = 'encryption',
    
    // Sistema
    SYSTEM_CONFIG = 'system_config',
    SYSTEM_HEALTH = 'system_health',
    SYSTEM_LOGS = 'system_logs',
    
    // Dados Sensíveis
    SENSITIVE_DATA = 'sensitive_data',
    PERSONAL_DATA = 'personal_data',
    FINANCIAL_DATA = 'financial_data',
    MEDICAL_DATA = 'medical_data'
}

export enum PermissionScope {
    GLOBAL = 'global',       // Acesso global ao recurso
    DEPARTMENT = 'department', // Acesso apenas ao departamento
    SELF = 'self',          // Acesso apenas aos próprios dados
    ASSIGNED = 'assigned',   // Acesso apenas aos dados atribuídos
    READONLY = 'readonly',   // Acesso apenas de leitura
    LIMITED = 'limited'     // Acesso limitado por regras específicas
}

export enum DataClassification {
    PUBLIC = 'public',           // Dados públicos
    INTERNAL = 'internal',       // Dados internos
    CONFIDENTIAL = 'confidential', // Dados confidenciais
    RESTRICTED = 'restricted',   // Dados restritos
    SECRET = 'secret'           // Dados secretos
}

export class EnhancedPermission {
    @ApiProperty({ enum: SecurityResource })
    @IsEnum(SecurityResource)
    resource: SecurityResource;

    @ApiProperty({ enum: SecurityAction, isArray: true })
    @IsArray()
    @IsEnum(SecurityAction, { each: true })
    actions: SecurityAction[];

    @ApiProperty({ enum: PermissionScope })
    @IsEnum(PermissionScope)
    scope: PermissionScope;

    @ApiProperty({ enum: DataClassification })
    @IsEnum(DataClassification)
    dataClassification: DataClassification;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    conditions?: string[]; // Condições específicas para a permissão

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    restrictions?: string[]; // Restrições específicas

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    timeRestriction?: string; // Restrições de horário (ex: "09:00-18:00")

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    ipRestrictions?: string[]; // Restrições de IP
}

export class RolePermissionMatrix {
    @ApiProperty({ enum: Role })
    @IsEnum(Role)
    role: Role;

    @ApiProperty({ type: [EnhancedPermission] })
    @IsArray()
    permissions: EnhancedPermission[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    inheritFrom?: Role[]; // Herdar permissões de outros roles
}

// Matriz de permissões aprimorada
export const ENHANCED_ROLE_PERMISSIONS: Record<Role, EnhancedPermission[]> = {
    [Role.ADMINISTRADOR]: [
        // Usuários e Sistema
        {
            resource: SecurityResource.USERS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE, SecurityAction.DELETE, SecurityAction.AUDIT],
            scope: PermissionScope.GLOBAL,
            dataClassification: DataClassification.CONFIDENTIAL
        },
        {
            resource: SecurityResource.SECURITY_EVENTS,
            actions: [SecurityAction.READ, SecurityAction.UPDATE, SecurityAction.DELETE, SecurityAction.AUDIT],
            scope: PermissionScope.GLOBAL,
            dataClassification: DataClassification.SECRET
        },
        {
            resource: SecurityResource.BACKUP,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.EXECUTE, SecurityAction.DELETE],
            scope: PermissionScope.GLOBAL,
            dataClassification: DataClassification.SECRET
        },
        {
            resource: SecurityResource.ENCRYPTION,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE, SecurityAction.EXECUTE],
            scope: PermissionScope.GLOBAL,
            dataClassification: DataClassification.SECRET
        },
        // Todos os outros recursos com acesso completo
        ...Object.values(SecurityResource)
            .filter(resource => ![SecurityResource.SECURITY_EVENTS, SecurityResource.BACKUP, SecurityResource.ENCRYPTION].includes(resource as SecurityResource))
            .map(resource => ({
                resource: resource as SecurityResource,
                actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE, SecurityAction.DELETE] as SecurityAction[],
                scope: PermissionScope.GLOBAL,
                dataClassification: DataClassification.CONFIDENTIAL
            }))
    ],

    [Role.MEDICO]: [
        // Dados médicos com acesso completo
        {
            resource: SecurityResource.MEDICAL_HISTORY,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.SECRET,
            conditions: ['patient_assigned', 'active_treatment']
        },
        {
            resource: SecurityResource.TREATMENTS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.SECRET
        },
        {
            resource: SecurityResource.APPOINTMENTS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.CONFIDENTIAL,
            conditions: ['professional_assigned']
        },
        // Clientes - apenas leitura e atualização
        {
            resource: SecurityResource.CLIENTS,
            actions: [SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.CONFIDENTIAL
        },
        // Relatórios - apenas leitura
        {
            resource: SecurityResource.REPORTS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.DASHBOARD,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        }
    ],

    [Role.RECEPCIONISTA]: [
        // Clientes e agendamentos
        {
            resource: SecurityResource.CLIENTS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.APPOINTMENTS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE, SecurityAction.DELETE],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.PAYMENTS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.CONFIDENTIAL
        },
        // Dados médicos - apenas leitura limitada
        {
            resource: SecurityResource.MEDICAL_HISTORY,
            actions: [SecurityAction.READ],
            scope: PermissionScope.LIMITED,
            dataClassification: DataClassification.CONFIDENTIAL,
            restrictions: ['no_diagnosis', 'no_treatment_details']
        },
        // Relatórios básicos
        {
            resource: SecurityResource.REPORTS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.LIMITED,
            dataClassification: DataClassification.INTERNAL,
            restrictions: ['basic_reports_only']
        }
    ],

    [Role.TÉCNICO_DE_ENFERMAGEM]: [
        // Atendimentos e procedimentos
        {
            resource: SecurityResource.APPOINTMENTS,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.CONFIDENTIAL
        },
        {
            resource: SecurityResource.CLIENTS,
            actions: [SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.CONFIDENTIAL
        },
        {
            resource: SecurityResource.ATTENDANCES,
            actions: [SecurityAction.CREATE, SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.ASSIGNED,
            dataClassification: DataClassification.CONFIDENTIAL
        },
        {
            resource: SecurityResource.PROFESSIONALS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.SERVICES,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.PRODUCTS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.STOCK_MOVEMENTS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.REPORTS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        },
        {
            resource: SecurityResource.DASHBOARD,
            actions: [SecurityAction.READ],
            scope: PermissionScope.DEPARTMENT,
            dataClassification: DataClassification.INTERNAL
        }
    ],

    [Role.SERVICOS_GERAIS]: [
        // Apenas dados de manutenção e limpeza
        {
            resource: SecurityResource.SYSTEM_HEALTH,
            actions: [SecurityAction.READ, SecurityAction.UPDATE],
            scope: PermissionScope.LIMITED,
            dataClassification: DataClassification.INTERNAL
        },
        // Estoque básico para limpeza
        {
            resource: SecurityResource.PRODUCTS,
            actions: [SecurityAction.READ],
            scope: PermissionScope.LIMITED,
            dataClassification: DataClassification.INTERNAL,
            conditions: ['cleaning_products_only']
        }
    ]
};

export class PermissionCheckDto {
    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty({ enum: SecurityResource })
    @IsEnum(SecurityResource)
    resource: SecurityResource;

    @ApiProperty({ enum: SecurityAction })
    @IsEnum(SecurityAction)
    action: SecurityAction;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    resourceId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    context?: any; // Contexto adicional para verificação
}

export class PermissionResult {
    @ApiProperty()
    allowed: boolean;

    @ApiProperty()
    reason: string;

    @ApiProperty({ required: false })
    conditions?: string[];

    @ApiProperty({ required: false })
    restrictions?: string[];

    @ApiProperty({ enum: PermissionScope, required: false })
    scope?: PermissionScope;

    @ApiProperty({ enum: DataClassification, required: false })
    dataClassification?: DataClassification;
}
