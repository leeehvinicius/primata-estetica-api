import { Role } from '@prisma/client';

export interface Permission {
  resource: string;
  actions: string[];
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMINISTRADOR: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'profiles', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'appointments',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'patients', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'medical_records',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'system_settings',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'facilities', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'client_preferences',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'attendances',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'medical_history',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'treatments', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'professionals',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'professional_schedules',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'professional_services',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'services', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'service_categories',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'service_packages',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'service_promotions',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'appointments',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'appointment_reminders',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'payments', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'payment_receipts',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'commissions',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'product_categories',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    {
      resource: 'stock_movements',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'stock_alerts',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'service_products',
      actions: ['create', 'read', 'update', 'delete'],
    },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'analytics', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'security', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'audit', actions: ['read'] },
    { resource: 'security_events', actions: ['read', 'update'] },
    { resource: 'user_sessions', actions: ['read', 'delete'] },
    { resource: 'security_configuration', actions: ['read', 'update'] },
    // Partners module
    { resource: 'partners', actions: ['create', 'read', 'update', 'delete'] },
    // External integrations
    {
      resource: 'external-integration',
      actions: ['create', 'read', 'update', 'delete'],
    },
  ],
  MEDICO: [
    { resource: 'patients', actions: ['read', 'update'] },
    { resource: 'medical_records', actions: ['create', 'read', 'update'] },
    { resource: 'appointments', actions: ['read', 'update'] },
    { resource: 'treatments', actions: ['create', 'read', 'update'] },
    { resource: 'diagnoses', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'client_preferences', actions: ['read', 'update'] },
    { resource: 'attendances', actions: ['read', 'update'] },
    { resource: 'medical_history', actions: ['create', 'read', 'update'] },
    { resource: 'treatments', actions: ['create', 'read', 'update'] },
    { resource: 'professionals', actions: ['read'] },
    { resource: 'professional_schedules', actions: ['read'] },
    { resource: 'professional_services', actions: ['read'] },
    { resource: 'services', actions: ['read'] },
    { resource: 'service_categories', actions: ['read'] },
    { resource: 'service_packages', actions: ['read'] },
    { resource: 'service_promotions', actions: ['read'] },
    { resource: 'appointments', actions: ['create', 'read', 'update'] },
    { resource: 'appointment_reminders', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'payment_receipts', actions: ['read'] },
    { resource: 'commissions', actions: ['read'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'product_categories', actions: ['read'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'stock_movements', actions: ['read'] },
    { resource: 'stock_alerts', actions: ['read'] },
    { resource: 'service_products', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
    // Partners module
    { resource: 'partners', actions: ['read'] },
  ],
  RECEPCIONISTA: [
    { resource: 'patients', actions: ['create', 'read'] },
    { resource: 'appointments', actions: ['create', 'read', 'update'] },
    { resource: 'profiles', actions: ['read'] },
    { resource: 'basic_reports', actions: ['read'] },
    { resource: 'clients', actions: ['create', 'read', 'update'] },
    { resource: 'client_preferences', actions: ['create', 'read', 'update'] },
    { resource: 'attendances', actions: ['create', 'read', 'update'] },
    { resource: 'professionals', actions: ['read'] },
    { resource: 'professional_schedules', actions: ['read'] },
    { resource: 'professional_services', actions: ['read'] },
    { resource: 'services', actions: ['read'] },
    { resource: 'service_categories', actions: ['read'] },
    { resource: 'service_packages', actions: ['read'] },
    { resource: 'service_promotions', actions: ['read'] },
    {
      resource: 'appointments',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'appointment_reminders',
      actions: ['create', 'read', 'update'],
    },
    { resource: 'payments', actions: ['create', 'read', 'update'] },
    { resource: 'payment_receipts', actions: ['create', 'read', 'update'] },
    { resource: 'commissions', actions: ['read'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'product_categories', actions: ['read'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'stock_movements', actions: ['create', 'read'] },
    { resource: 'stock_alerts', actions: ['read'] },
    { resource: 'service_products', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
    // Partners module
    { resource: 'partners', actions: ['create', 'read', 'update'] },
    // External integrations
    { resource: 'external-integration', actions: ['read'] },
  ],
  TÉCNICO_DE_ENFERMAGEM: [
    { resource: 'patients', actions: ['read', 'update'] },
    { resource: 'appointments', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'attendances', actions: ['create', 'read', 'update'] },
    { resource: 'professionals', actions: ['read'] },
    { resource: 'professional_schedules', actions: ['read'] },
    { resource: 'services', actions: ['read'] },
    { resource: 'appointment_reminders', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'stock_movements', actions: ['read'] },
    { resource: 'stock_alerts', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
  ],
  SERVICOS_GERAIS: [
    { resource: 'facilities', actions: ['read', 'update'] },
    { resource: 'maintenance', actions: ['create', 'read', 'update'] },
    { resource: 'cleaning_schedule', actions: ['read', 'update'] },
  ],
  TECNICO: [
    { resource: 'patients', actions: ['read', 'update'] },
    { resource: 'appointments', actions: ['read', 'update'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'attendances', actions: ['create', 'read', 'update'] },
    { resource: 'professionals', actions: ['read'] },
    { resource: 'services', actions: ['read'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'stock_movements', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
  ],
  ESTAGIARIO: [
    { resource: 'patients', actions: ['read'] },
    { resource: 'appointments', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'attendances', actions: ['read'] },
    { resource: 'professionals', actions: ['read'] },
    { resource: 'services', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
  ],
};

export const hasPermission = (
  userRole: Role,
  resource: string,
  action: string,
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  const resourcePermission = permissions.find((p) => p.resource === resource);
  if (!resourcePermission) return false;

  return resourcePermission.actions.includes(action);
};

export const getRoleDescription = (role: Role): string => {
  const descriptions = {
    ADMINISTRADOR:
      'Controle total sobre o sistema, incluindo gestão de usuários e configurações',
    MEDICO: 'Acesso completo aos históricos de pacientes e registros médicos',
    RECEPCIONISTA:
      'Atendimento inicial aos pacientes e agendamento de consultas',
    TÉCNICO_DE_ENFERMAGEM:
      'Técnico de enfermagem - procedimentos e cuidados aos pacientes',
    SERVICOS_GERAIS: 'Manutenção e organização das instalações',
    TECNICO: 'Técnico - suporte em procedimentos e atendimentos',
    ESTAGIARIO: 'Estagiário - acompanhamento e aprendizado',
  };
  return descriptions[role];
};
