import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.profile) {
      throw new ForbiddenException('Usuário não autenticado ou sem perfil');
    }

    const userRole = user.profile.role as Role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Acesso negado. Role ${userRole} não tem permissão para acessar este recurso`,
      );
    }

    return true;
  }
}
