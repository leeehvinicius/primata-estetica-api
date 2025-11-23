import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { EncryptionService } from './encryption.service';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RateLimitGuard, AdminRateLimit } from './guards/rate-limit.guard';

@ApiTags('Security & Audit')
@Controller('security')
@UseGuards(JwtAccessGuard, RolesGuard, RateLimitGuard)
@AdminRateLimit
export class SecurityController {
  constructor(
    private securityService: SecurityService,
    private encryptionService: EncryptionService,
  ) {}

  // ===== RELATÓRIOS DE SEGURANÇA =====
  @ApiOperation({ summary: 'Obter relatório de segurança' })
  @ApiResponse({ status: 200, description: 'Relatório de segurança' })
  @Get('report')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data de início (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data de fim (YYYY-MM-DD)',
  })
  async getSecurityReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.securityService.getSecurityReport(start, end);
  }

  // ===== LOGS DE AUDITORIA =====
  @ApiOperation({ summary: 'Buscar logs de auditoria' })
  @ApiResponse({ status: 200, description: 'Logs de auditoria' })
  @Get('audit-logs')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('audit', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtrar por usuário',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    description: 'Filtrar por ação',
  })
  @ApiQuery({
    name: 'resource',
    required: false,
    type: String,
    description: 'Filtrar por recurso',
  })
  @ApiQuery({
    name: 'severity',
    required: false,
    type: String,
    description: 'Filtrar por severidade',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data de início',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data de fim',
  })
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('severity') severity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (severity) where.severity = severity;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      (this.securityService as any).prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      (this.securityService as any).prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== EVENTOS DE SEGURANÇA =====
  @ApiOperation({ summary: 'Buscar eventos de segurança' })
  @ApiResponse({ status: 200, description: 'Eventos de segurança' })
  @Get('events')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'severity', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean })
  async getSecurityEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('severity') severity?: string,
    @Query('eventType') eventType?: string,
    @Query('resolved') resolved?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (severity) where.severity = severity;
    if (eventType) where.eventType = eventType;
    if (resolved !== undefined) where.resolved = resolved;

    const [events, total] = await Promise.all([
      (this.securityService as any).prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      (this.securityService as any).prisma.securityEvent.count({ where }),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @ApiOperation({ summary: 'Resolver evento de segurança' })
  @ApiResponse({ status: 200, description: 'Evento resolvido' })
  @Put('events/:id/resolve')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'update')
  @UseGuards(RolePermissionGuard)
  async resolveSecurityEvent(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @GetUser() user: any,
  ) {
    const event = await (
      this.securityService as any
    ).prisma.securityEvent.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: user.id,
        notes: body.notes,
      },
    });

    // Log da resolução
    await this.securityService.logAction({
      userId: user.id,
      action: 'UPDATE',
      resource: 'security_events',
      resourceId: id,
      method: 'PUT',
      endpoint: `/security/events/${id}/resolve`,
      ipAddress: '127.0.0.1', // TODO: extrair do request
      success: true,
      metadata: { resolved: true, notes: body.notes },
    });

    return event;
  }

  // ===== SESSÕES ATIVAS =====
  @ApiOperation({ summary: 'Listar sessões ativas' })
  @ApiResponse({ status: 200, description: 'Sessões ativas' })
  @Get('sessions')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getActiveSessions(@Query('userId') userId?: string) {
    const where: any = {
      isActive: true,
      expiresAt: { gt: new Date() },
    };

    if (userId) where.userId = userId;

    return (this.securityService as any).prisma.userSession.findMany({
      where,
      orderBy: { lastActivity: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  @ApiOperation({ summary: 'Terminar sessão' })
  @ApiResponse({ status: 200, description: 'Sessão terminada' })
  @Delete('sessions/:id')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'delete')
  @UseGuards(RolePermissionGuard)
  @HttpCode(HttpStatus.OK)
  async terminateSession(@Param('id') sessionId: string, @GetUser() user: any) {
    await this.securityService.terminateSession(sessionId, user.id);

    // Log da ação
    await this.securityService.logAction({
      userId: user.id,
      action: 'DELETE',
      resource: 'user_sessions',
      resourceId: sessionId,
      method: 'DELETE',
      endpoint: `/security/sessions/${sessionId}`,
      ipAddress: '127.0.0.1', // TODO: extrair do request
      success: true,
      metadata: { terminatedBy: user.id },
    });

    return { message: 'Sessão terminada com sucesso' };
  }

  @ApiOperation({ summary: 'Terminar todas as sessões de um usuário' })
  @ApiResponse({ status: 200, description: 'Sessões terminadas' })
  @Delete('users/:userId/sessions')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'delete')
  @UseGuards(RolePermissionGuard)
  @HttpCode(HttpStatus.OK)
  async terminateAllUserSessions(
    @Param('userId') userId: string,
    @GetUser() user: any,
  ) {
    await this.securityService.terminateAllUserSessions(
      userId,
      undefined,
      user.id,
    );

    // Log da ação
    await this.securityService.logAction({
      userId: user.id,
      action: 'DELETE',
      resource: 'user_sessions',
      resourceId: userId,
      method: 'DELETE',
      endpoint: `/security/users/${userId}/sessions`,
      ipAddress: '127.0.0.1', // TODO: extrair do request
      success: true,
      metadata: { targetUserId: userId, terminatedBy: user.id },
    });

    return { message: 'Todas as sessões do usuário foram terminadas' };
  }

  // ===== CONFIGURAÇÕES DE SEGURANÇA =====
  @ApiOperation({ summary: 'Obter configurações de segurança' })
  @ApiResponse({ status: 200, description: 'Configurações de segurança' })
  @Get('config')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'read')
  @UseGuards(RolePermissionGuard)
  async getSecurityConfigurations() {
    return (this.securityService as any).prisma.securityConfiguration.findMany({
      orderBy: { category: 'asc' },
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        category: true,
        sensitive: true,
        updatedAt: true,
        updater: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  @ApiOperation({ summary: 'Atualizar configuração de segurança' })
  @ApiResponse({ status: 200, description: 'Configuração atualizada' })
  @Put('config')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'update')
  @UseGuards(RolePermissionGuard)
  async updateSecurityConfiguration(
    @Body()
    body: {
      key: string;
      value: string;
      description?: string;
      category: string;
      sensitive?: boolean;
    },
    @GetUser() user: any,
  ) {
    const config = await this.securityService.setSecurityConfig(
      body.key,
      body.value,
      body.category,
      user.id,
      body.description,
      body.sensitive,
    );

    // Log da ação
    await this.securityService.logAction({
      userId: user.id,
      action: 'UPDATE',
      resource: 'security_configuration',
      resourceId: config.id,
      method: 'PUT',
      endpoint: '/security/config',
      ipAddress: '127.0.0.1', // TODO: extrair do request
      success: true,
      metadata: { key: body.key, category: body.category },
    });

    return config;
  }

  // ===== VALIDAÇÃO DE SENHA =====
  @ApiOperation({ summary: 'Validar política de senha' })
  @ApiResponse({ status: 200, description: 'Resultado da validação' })
  @Post('validate-password')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('security', 'read')
  @UseGuards(RolePermissionGuard)
  validatePassword(@Body() body: { password: string }) {
    return this.encryptionService.validatePasswordPolicy(body.password);
  }

  // ===== ESTATÍSTICAS DE SEGURANÇA =====
  @ApiOperation({ summary: 'Obter estatísticas de segurança' })
  @ApiResponse({ status: 200, description: 'Estatísticas de segurança' })
  @Get('stats')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('security', 'read')
  @UseGuards(RolePermissionGuard)
  async getSecurityStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAuditLogs,
      todayAuditLogs,
      activeSessions,
      unresolvedEvents,
      todayLoginAttempts,
      failedLoginAttempts,
      criticalEvents,
      weeklyEvents,
    ] = await Promise.all([
      (this.securityService as any).prisma.auditLog.count(),
      (this.securityService as any).prisma.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      (this.securityService as any).prisma.userSession.count({
        where: { isActive: true, expiresAt: { gt: now } },
      }),
      (this.securityService as any).prisma.securityEvent.count({
        where: { resolved: false },
      }),
      (this.securityService as any).prisma.loginAttempt.count({
        where: { createdAt: { gte: today } },
      }),
      (this.securityService as any).prisma.loginAttempt.count({
        where: {
          success: false,
          createdAt: { gte: today },
        },
      }),
      (this.securityService as any).prisma.securityEvent.count({
        where: {
          severity: 'CRITICAL',
          resolved: false,
        },
      }),
      (this.securityService as any).prisma.securityEvent.count({
        where: { createdAt: { gte: thisWeek } },
      }),
    ]);

    return {
      totalAuditLogs,
      todayAuditLogs,
      activeSessions,
      unresolvedEvents,
      todayLoginAttempts,
      failedLoginAttempts,
      criticalEvents,
      weeklyEvents,
      securityScore: this.calculateSecurityScore({
        unresolvedEvents,
        criticalEvents,
        failedLoginAttempts,
        activeSessions,
      }),
    };
  }

  private calculateSecurityScore(metrics: {
    unresolvedEvents: number;
    criticalEvents: number;
    failedLoginAttempts: number;
    activeSessions: number;
  }): number {
    let score = 100;

    // Reduzir pontuação baseado em eventos não resolvidos
    score -= metrics.unresolvedEvents * 5;

    // Reduzir mais por eventos críticos
    score -= metrics.criticalEvents * 10;

    // Reduzir por tentativas de login falhadas
    score -= Math.min(metrics.failedLoginAttempts * 2, 20);

    // Manter entre 0 e 100
    return Math.max(0, Math.min(100, score));
  }
}
