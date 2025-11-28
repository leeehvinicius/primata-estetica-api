import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BaileysIntegrationService } from './services/baileys-integration.service';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { Role } from '@prisma/client';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAccessGuard, RolesGuard)
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private readonly baileysService: BaileysIntegrationService) {}

  @ApiOperation({
    summary: 'Conectar ao WhatsApp',
    description:
      'Inicia a conexão com o WhatsApp. Se não houver credenciais salvas, retorna um QR Code para escanear. Se já houver credenciais, tenta conectar automaticamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conexão iniciada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status: {
          type: 'string',
          enum: ['connected', 'connecting', 'qr_code_ready'],
        },
        message: { type: 'string' },
        qrCode: {
          type: 'string',
          description: 'QR Code em base64 (data:image/png;base64,...)',
          nullable: true,
        },
      },
    },
  })
  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('external-integration', 'update')
  @UseGuards(RolePermissionGuard)
  async connect() {
    try {
      const result = await this.baileysService.connect();
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'error',
        message: error.message || 'Erro ao conectar ao WhatsApp',
      };
    }
  }

  @ApiOperation({
    summary: 'Verificar status da conexão WhatsApp',
    description:
      'Retorna o status atual da conexão com o WhatsApp, incluindo QR Code se disponível.',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da conexão',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        connected: { type: 'boolean' },
        status: { type: 'string' },
        message: { type: 'string' },
        qrCode: {
          type: 'string',
          description: 'QR Code em base64 (se disponível)',
          nullable: true,
        },
      },
    },
  })
  @Get('status')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @RequirePermission('external-integration', 'read')
  @UseGuards(RolePermissionGuard)
  async getStatus() {
    const status = await this.baileysService.checkStatus();
    return {
      success: true,
      ...status,
    };
  }

  @ApiOperation({
    summary: 'Obter QR Code atual',
    description:
      'Retorna o QR Code atual se disponível. Use este endpoint para atualizar o QR Code na interface.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR Code atual',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        qrCode: {
          type: 'string',
          description: 'QR Code em base64 (data:image/png;base64,...)',
          nullable: true,
        },
        hasQRCode: { type: 'boolean' },
      },
    },
  })
  @Get('qr-code')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @RequirePermission('external-integration', 'read')
  @UseGuards(RolePermissionGuard)
  async getQRCode() {
    const qrCode = this.baileysService.getQRCode();
    return {
      success: true,
      qrCode: qrCode || null,
      hasQRCode: !!qrCode,
    };
  }

  @ApiOperation({
    summary: 'Desconectar do WhatsApp',
    description: 'Desconecta do WhatsApp e mantém as credenciais salvas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Desconectado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('external-integration', 'update')
  @UseGuards(RolePermissionGuard)
  async disconnect() {
    await this.baileysService.disconnect();
    return {
      success: true,
      message: 'Desconectado do WhatsApp com sucesso',
    };
  }

  @ApiOperation({
    summary: 'Limpar autenticação do WhatsApp',
    description:
      'Remove as credenciais salvas e força a geração de um novo QR Code na próxima conexão. Use isso se precisar conectar com outra conta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticação limpa com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @Delete('clear-auth')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('external-integration', 'delete')
  @UseGuards(RolePermissionGuard)
  async clearAuth() {
    await this.baileysService.clearAuth();
    return {
      success: true,
      message: 'Autenticação limpa com sucesso. Conecte novamente para gerar novo QR Code.',
    };
  }
}

