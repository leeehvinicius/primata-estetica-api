import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { ExternalIntegrationService } from './external-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Integrações Externas')
@Controller('external-integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExternalIntegrationController {
    constructor(private externalIntegrationService: ExternalIntegrationService) {}

    // ===== PAGAMENTOS =====

    @Post('payments/process')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @ApiOperation({ summary: 'Processar pagamento através de gateway externo' })
    @ApiResponse({ status: 201, description: 'Pagamento processado com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
    async processPayment(@Body() paymentData: {
        amount: number;
        currency: string;
        description: string;
        clientId: string;
        appointmentId?: string;
        paymentMethod: string;
        metadata?: any;
    }) {
        return this.externalIntegrationService.processPayment(paymentData);
    }

    @Post(':paymentId/refund')
    async refundPayment(
        @Param('paymentId') paymentId: string,
        @Body() refundData: { amount?: number; reason?: string }
    ) {
        return this.externalIntegrationService.refundPayment(
            paymentId,
            refundData.amount
        );
    }

    @Get('payments/:paymentId/status')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @ApiOperation({ summary: 'Verificar status de pagamento' })
    @ApiResponse({ status: 200, description: 'Status do pagamento' })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    async checkPaymentStatus(@Param('paymentId') paymentId: string) {
        return this.externalIntegrationService.checkPaymentStatus(paymentId);
    }

    // ===== RELATÓRIOS FINANCEIROS =====

    @Post('accounting/export')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Exportar relatórios financeiros' })
    @ApiResponse({ status: 200, description: 'Relatório exportado com sucesso' })
    @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
    async exportFinancialReports(@Body() exportData: {
        startDate: Date;
        endDate: Date;
        format: 'csv' | 'xml' | 'json';
    }) {
        return this.externalIntegrationService.exportFinancialReports(exportData);
    }

    @Post('accounting/sync')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Sincronizar dados com sistema de contabilidade' })
    @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
    async syncWithAccountingSystem(@Body() syncData: {
        startDate: Date;
        endDate: Date;
    }) {
        return this.externalIntegrationService.syncWithAccountingSystem(syncData);
    }

    // ===== CRM =====

    @Post('crm/sync')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Sincronizar clientes com CRM' })
    @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
    async syncClientsWithCrm(@Body() syncData: {
        clientIds?: string[];
    }) {
        return this.externalIntegrationService.syncClientsWithCrm(syncData.clientIds);
    }

    @Post('crm/import')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Importar dados do CRM' })
    @ApiResponse({ status: 200, description: 'Importação realizada com sucesso' })
    async importFromCrm(@Body() importData: {
        lastSync?: Date;
        status?: string;
        tags?: string[];
    }) {
        return this.externalIntegrationService.importFromCrm(importData);
    }

    @Get('crm/clients/:clientId')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @ApiOperation({ summary: 'Buscar informações do cliente no CRM' })
    @ApiResponse({ status: 200, description: 'Dados do cliente no CRM' })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    async getClientFromCrm(@Param('clientId') clientId: string) {
        return this.externalIntegrationService.getClientFromCrm(clientId);
    }

    // ===== CONFIGURAÇÕES =====

    @Post('configure')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Configurar integração externa' })
    @ApiResponse({ status: 201, description: 'Integração configurada com sucesso' })
    @ApiResponse({ status: 400, description: 'Configuração inválida' })
    async configureIntegration(@Body() config: {
        type: 'PAYMENT' | 'ACCOUNTING' | 'CRM' | 'WEBHOOK';
        provider: string;
        credentials: any;
        settings: any;
    }) {
        return this.externalIntegrationService.configureIntegration(config);
    }

    @Get('status')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Verificar status das integrações' })
    @ApiResponse({ status: 200, description: 'Status das integrações' })
    async checkIntegrationStatus() {
        return this.externalIntegrationService.checkIntegrationStatus();
    }

    @Get('logs')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Obter logs de integração' })
    @ApiResponse({ status: 200, description: 'Logs de integração' })
    @ApiQuery({ name: 'type', required: false, description: 'Tipo de log' })
    @ApiQuery({ name: 'status', required: false, description: 'Status do log' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Data final' })
    @ApiQuery({ name: 'limit', required: false, description: 'Limite de registros' })
    async getIntegrationLogs(@Query() filters: {
        type?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }) {
        return this.externalIntegrationService.getIntegrationLogs(filters);
    }

    // ===== WEBHOOKS =====

    @Post('webhooks/incoming')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Processar webhook recebido' })
    @ApiResponse({ status: 200, description: 'Webhook processado com sucesso' })
    @ApiResponse({ status: 400, description: 'Webhook inválido' })
    async processIncomingWebhook(
        @Body() webhookData: any,
        @Query('signature') signature?: string
    ) {
        return this.externalIntegrationService.processIncomingWebhook(webhookData, signature);
    }

    @Post('webhooks/send')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Enviar webhook customizado' })
    @ApiResponse({ status: 200, description: 'Webhook enviado com sucesso' })
    async sendCustomWebhook(@Body() webhookData: {
        type: string;
        data: any;
        event: string;
    }) {
        return this.externalIntegrationService.sendCustomWebhook(
            webhookData.type,
            webhookData.data,
            webhookData.event
        );
    }

    // ===== API GENÉRICA =====

    @Post('api/request')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Fazer requisição para API externa' })
    @ApiResponse({ status: 200, description: 'Requisição realizada com sucesso' })
    async makeApiRequest(@Body() requestData: {
        integrationId: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        endpoint: string;
        data?: any;
        headers?: any;
        params?: any;
    }) {
        return this.externalIntegrationService.makeApiRequest(requestData);
    }

    @Post('api/sync')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Sincronizar dados com API externa' })
    @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
    async syncDataWithApi(@Body() syncData: {
        integrationId: string;
        dataType: string;
        data: any[];
        syncMode: 'CREATE' | 'UPDATE' | 'UPSERT';
        batchSize?: number;
    }) {
        return this.externalIntegrationService.syncDataWithApi(syncData);
    }

    @Post('api/import')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Importar dados de API externa' })
    @ApiResponse({ status: 200, description: 'Importação realizada com sucesso' })
    async importDataFromApi(@Body() importData: {
        integrationId: string;
        dataType: string;
        endpoint: string;
        filters?: any;
        transformFunction?: string;
    }) {
        return this.externalIntegrationService.importDataFromApi(importData);
    }

    @Get('api/:integrationId/status')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Verificar status da API' })
    @ApiResponse({ status: 200, description: 'Status da API' })
    async checkApiStatus(@Param('integrationId') integrationId: string) {
        return this.externalIntegrationService.checkApiStatus(integrationId);
    }

    @Post('api/:integrationId/test')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Testar conexão com API' })
    @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
    async testApiConnection(@Param('integrationId') integrationId: string) {
        return this.externalIntegrationService.testApiConnection(integrationId);
    }

    @Get('api/:integrationId/stats')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Obter estatísticas de uso da API' })
    @ApiResponse({ status: 200, description: 'Estatísticas de uso' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Data final' })
    async getApiUsageStats(
        @Param('integrationId') integrationId: string,
        @Query() period?: { startDate?: Date; endDate?: Date }
    ) {
        return this.externalIntegrationService.getApiUsageStats(integrationId, period);
    }

    // ===== ENDPOINTS DE TESTE =====

    @Post('test/payment-connection')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Testar conexão com gateway de pagamento' })
    @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
    async testPaymentConnection() {
        return this.externalIntegrationService.testPaymentConnection();
    }

    @Post('test/accounting-connection')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Testar conexão com sistema de contabilidade' })
    @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
    async testAccountingConnection() {
        return this.externalIntegrationService.testAccountingConnection();
    }

    @Post('test/crm-connection')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Testar conexão com CRM' })
    @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
    async testCrmConnection() {
        return this.externalIntegrationService.testCrmConnection();
    }

    @Post('test/webhook-connection')
    @Roles(Role.ADMINISTRADOR)
    @ApiOperation({ summary: 'Testar conexão com webhooks' })
    @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
    async testWebhookConnection() {
        return this.externalIntegrationService.testWebhookConnection();
    }
}
