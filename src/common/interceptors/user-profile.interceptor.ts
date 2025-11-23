import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserProfileInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se há um usuário autenticado mas sem perfil, buscar o perfil
    if (user && user.sub && !user.profile) {
      try {
        const userWithProfile = await this.prisma.user.findUnique({
          where: { id: user.sub },
          include: { profile: true },
        });

        if (userWithProfile && userWithProfile.profile) {
          // Atualizar o objeto user na request
          request.user = {
            ...user,
            profile: userWithProfile.profile,
          };
        }
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      }
    }

    return next.handle();
  }
}
