import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '../constants/permissions';
import { Role } from '@prisma/client';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const RequirePermission = (resource: string, action: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('permission', { resource, action }, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true; // Se não há permissão definida, permite acesso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.profile) {
      throw new ForbiddenException('Usuário não autenticado ou sem perfil');
    }

    const userRole = user.profile.role as Role;
    const { resource, action } = requiredPermission;

    if (!hasPermission(userRole, resource, action)) {
      throw new ForbiddenException(
        `Acesso negado. Role ${userRole} não tem permissão para ${action} em ${resource}`,
      );
    }

    return true;
  }
}
