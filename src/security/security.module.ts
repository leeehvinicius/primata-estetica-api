import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { SecurityService } from './security.service';
import { EncryptionService } from './encryption.service';
import { BackupService } from './backup.service';
import { EnhancedPermissionsService } from './enhanced-permissions.service';
import { SecurityController } from './security.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { EnhancedJwtGuard } from './guards/enhanced-jwt.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    EncryptionService,
    BackupService,
    EnhancedPermissionsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    // Note: EnhancedJwtGuard não é global para não conflitar com o JWT guard existente
    // Ele deve ser usado explicitamente onde necessário
  ],
  exports: [
    SecurityService,
    EncryptionService,
    BackupService,
    EnhancedPermissionsService,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*'); // Aplicar headers de segurança em todas as rotas
  }
}
