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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AgreementsService } from './agreements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Agreements - Gestão de Convênios e Descontos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  // ===== PLANOS DE SAÚDE =====

  @Post('health-plans')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Criar novo plano de saúde' })
  @ApiResponse({ status: 201, description: 'Plano de saúde criado com sucesso' })
  async createHealthPlan(@Body() data: any) {
    return this.agreementsService.createHealthPlan(data);
  }

  @Get('health-plans')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar todos os planos de saúde' })
  @ApiResponse({ status: 200, description: 'Lista de planos de saúde' })
  async getAllHealthPlans() {
    return this.agreementsService.getAllHealthPlans();
  }

  @Get('health-plans/:id')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Buscar plano de saúde por ID' })
  @ApiParam({ name: 'id', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 200, description: 'Plano de saúde encontrado' })
  async getHealthPlan(@Param('id') id: string) {
    return this.agreementsService.getHealthPlan(id);
  }

  @Put('health-plans/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Atualizar plano de saúde' })
  @ApiParam({ name: 'id', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 200, description: 'Plano de saúde atualizado' })
  async updateHealthPlan(@Param('id') id: string, @Body() data: any) {
    return this.agreementsService.updateHealthPlan(id, data);
  }

  @Delete('health-plans/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Excluir plano de saúde' })
  @ApiParam({ name: 'id', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 200, description: 'Plano de saúde excluído' })
  async deleteHealthPlan(@Param('id') id: string) {
    return this.agreementsService.deleteHealthPlan(id);
  }

  // ===== CONVÊNIOS =====

  @Post('agreements')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Criar novo convênio para cliente' })
  @ApiResponse({ status: 201, description: 'Convênio criado com sucesso' })
  async createAgreement(@Body() data: any) {
    return this.agreementsService.createAgreement(data);
  }

  @Get('agreements')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar todos os convênios' })
  @ApiResponse({ status: 200, description: 'Lista de convênios' })
  async getAllAgreements() {
    return this.agreementsService.getAllAgreements();
  }

  @Get('agreements/:id')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Buscar convênio por ID' })
  @ApiParam({ name: 'id', description: 'ID do convênio' })
  @ApiResponse({ status: 200, description: 'Convênio encontrado' })
  async getAgreement(@Param('id') id: string) {
    return this.agreementsService.getAgreement(id);
  }

  @Get('clients/:clientId/agreements')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Buscar convênios de um cliente' })
  @ApiParam({ name: 'clientId', description: 'ID do cliente' })
  @ApiResponse({ status: 200, description: 'Convênios do cliente' })
  async getClientAgreements(@Param('clientId') clientId: string) {
    return this.agreementsService.getClientAgreements(clientId);
  }

  @Put('agreements/:id')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Atualizar convênio' })
  @ApiParam({ name: 'id', description: 'ID do convênio' })
  @ApiResponse({ status: 200, description: 'Convênio atualizado' })
  async updateAgreement(@Param('id') id: string, @Body() data: any) {
    return this.agreementsService.updateAgreement(id, data);
  }

  @Delete('agreements/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Excluir convênio' })
  @ApiParam({ name: 'id', description: 'ID do convênio' })
  @ApiResponse({ status: 200, description: 'Convênio excluído' })
  async deleteAgreement(@Param('id') id: string) {
    return this.agreementsService.deleteAgreement(id);
  }

  // ===== DESCONTOS =====

  @Post('agreements/:agreementId/discounts')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Criar desconto para convênio' })
  @ApiParam({ name: 'agreementId', description: 'ID do convênio' })
  @ApiResponse({ status: 201, description: 'Desconto criado com sucesso' })
  async createAgreementDiscount(
    @Param('agreementId') agreementId: string,
    @Body() data: any,
  ) {
    return this.agreementsService.createAgreementDiscount({
      ...data,
      agreementId,
    });
  }

  @Get('agreements/:agreementId/discounts')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar descontos de um convênio' })
  @ApiParam({ name: 'agreementId', description: 'ID do convênio' })
  @ApiResponse({ status: 200, description: 'Descontos do convênio' })
  async getAgreementDiscounts(@Param('agreementId') agreementId: string) {
    return this.agreementsService.getAgreementDiscounts(agreementId);
  }

  @Put('discounts/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Atualizar desconto' })
  @ApiParam({ name: 'id', description: 'ID do desconto' })
  @ApiResponse({ status: 200, description: 'Desconto atualizado' })
  async updateAgreementDiscount(@Param('id') id: string, @Body() data: any) {
    return this.agreementsService.updateAgreementDiscount(id, data);
  }

  @Delete('discounts/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Excluir desconto' })
  @ApiParam({ name: 'id', description: 'ID do desconto' })
  @ApiResponse({ status: 200, description: 'Desconto excluído' })
  async deleteAgreementDiscount(@Param('id') id: string) {
    return this.agreementsService.deleteAgreementDiscount(id);
  }

  @Post('calculate-discount')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Calcular desconto para serviço' })
  @ApiResponse({ status: 200, description: 'Desconto calculado' })
  async calculateDiscount(@Body() data: { agreementId: string; serviceId: string; amount: number }) {
    return this.agreementsService.calculateDiscount(
      data.agreementId,
      data.serviceId,
      data.amount,
    );
  }

  // ===== LIMITES DE COBERTURA =====

  @Post('health-plans/:healthPlanId/coverage-limits')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Criar limite de cobertura para plano de saúde' })
  @ApiParam({ name: 'healthPlanId', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 201, description: 'Limite de cobertura criado' })
  async createCoverageLimit(
    @Param('healthPlanId') healthPlanId: string,
    @Body() data: any,
  ) {
    return this.agreementsService.createCoverageLimit({
      ...data,
      healthPlanId,
    });
  }

  @Get('health-plans/:healthPlanId/coverage-limits')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar limites de cobertura de um plano' })
  @ApiParam({ name: 'healthPlanId', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 200, description: 'Limites de cobertura' })
  async getCoverageLimits(@Param('healthPlanId') healthPlanId: string) {
    return this.agreementsService.getCoverageLimits(healthPlanId);
  }

  @Put('coverage-limits/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Atualizar limite de cobertura' })
  @ApiParam({ name: 'id', description: 'ID do limite de cobertura' })
  @ApiResponse({ status: 200, description: 'Limite de cobertura atualizado' })
  async updateCoverageLimit(@Param('id') id: string, @Body() data: any) {
    return this.agreementsService.updateCoverageLimit(id, data);
  }

  @Delete('coverage-limits/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Excluir limite de cobertura' })
  @ApiParam({ name: 'id', description: 'ID do limite de cobertura' })
  @ApiResponse({ status: 200, description: 'Limite de cobertura excluído' })
  async deleteCoverageLimit(@Param('id') id: string) {
    return this.agreementsService.deleteCoverageLimit(id);
  }

  @Post('check-coverage-limit')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Verificar limite de cobertura' })
  @ApiResponse({ status: 200, description: 'Verificação de limite' })
  async checkCoverageLimit(@Body() data: { agreementId: string; serviceId: string; amount: number }) {
    return this.agreementsService.checkCoverageLimit(
      data.agreementId,
      data.serviceId,
      data.amount,
    );
  }

  // ===== PAGAMENTOS COM CONVÊNIOS =====

  @Post('agreements/:agreementId/payments')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Processar pagamento com convênio' })
  @ApiParam({ name: 'agreementId', description: 'ID do convênio' })
  @ApiResponse({ status: 201, description: 'Pagamento processado' })
  async processPaymentWithAgreement(
    @Param('agreementId') agreementId: string,
    @Body() paymentData: any,
  ) {
    return this.agreementsService.processPaymentWithAgreement(paymentData, agreementId);
  }

  @Get('agreements/:agreementId/payments')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar pagamentos de um convênio' })
  @ApiParam({ name: 'agreementId', description: 'ID do convênio' })
  @ApiResponse({ status: 200, description: 'Pagamentos do convênio' })
  async getAgreementPayments(@Param('agreementId') agreementId: string) {
    return this.agreementsService.getAgreementPayments(agreementId);
  }

  @Get('payments/:id')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Buscar pagamento com convênio por ID' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado' })
  async getAgreementPayment(@Param('id') id: string) {
    return this.agreementsService.getAgreementPayment(id);
  }

  @Put('payments/:id')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Atualizar pagamento com convênio' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado' })
  async updateAgreementPayment(@Param('id') id: string, @Body() data: any) {
    return this.agreementsService.updateAgreementPayment(id, data);
  }

  // ===== ALERTAS =====

  @Get('alerts')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar alertas ativos' })
  @ApiResponse({ status: 200, description: 'Alertas ativos' })
  async getActiveAlerts() {
    return this.agreementsService.getActiveAlerts();
  }

  @Get('agreements/:agreementId/alerts')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar alertas de um convênio' })
  @ApiParam({ name: 'agreementId', description: 'ID do convênio' })
  @ApiResponse({ status: 200, description: 'Alertas do convênio' })
  async getCoverageAlerts(@Param('agreementId') agreementId: string) {
    return this.agreementsService.getCoverageAlerts(agreementId);
  }

  @Put('alerts/:id/resolve')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Resolver alerta' })
  @ApiParam({ name: 'id', description: 'ID do alerta' })
  @ApiResponse({ status: 200, description: 'Alerta resolvido' })
  async resolveCoverageAlert(@Param('id') id: string) {
    return this.agreementsService.resolveCoverageAlert(id);
  }

  // ===== INTEGRAÇÃO COM OPERADORAS =====

  @Post('health-plans/:healthPlanId/integrations')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Criar integração com operadora' })
  @ApiParam({ name: 'healthPlanId', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 201, description: 'Integração criada' })
  async createOperatorIntegration(
    @Param('healthPlanId') healthPlanId: string,
    @Body() data: any,
  ) {
    return this.agreementsService.createOperatorIntegration({
      ...data,
      healthPlanId,
    });
  }

  @Get('health-plans/:healthPlanId/integrations')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Listar integrações de um plano' })
  @ApiParam({ name: 'healthPlanId', description: 'ID do plano de saúde' })
  @ApiResponse({ status: 200, description: 'Integrações do plano' })
  async getOperatorIntegrations(@Param('healthPlanId') healthPlanId: string) {
    return this.agreementsService.getOperatorIntegrations(healthPlanId);
  }

  @Post('integrations/:id/test')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Testar integração com operadora' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Teste de integração' })
  async testOperatorIntegration(@Param('id') id: string) {
    return this.agreementsService.testOperatorIntegration(id);
  }

  @Put('integrations/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Atualizar integração com operadora' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Integração atualizada' })
  async updateOperatorIntegration(@Param('id') id: string, @Body() data: any) {
    return this.agreementsService.updateOperatorIntegration(id, data);
  }

  @Delete('integrations/:id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Excluir integração com operadora' })
  @ApiParam({ name: 'id', description: 'ID da integração' })
  @ApiResponse({ status: 200, description: 'Integração excluída' })
  async deleteOperatorIntegration(@Param('id') id: string) {
    return this.agreementsService.deleteOperatorIntegration(id);
  }

  // ===== RELATÓRIOS =====

  @Get('reports/health-plans/:healthPlanId')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Gerar relatório de convênios por plano de saúde' })
  @ApiParam({ name: 'healthPlanId', description: 'ID do plano de saúde' })
  @ApiQuery({ name: 'startDate', description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Relatório gerado' })
  async generateAgreementReport(
    @Param('healthPlanId') healthPlanId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.agreementsService.generateAgreementReport(
      healthPlanId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports/clients/:clientId')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Gerar relatório de convênios por cliente' })
  @ApiParam({ name: 'clientId', description: 'ID do cliente' })
  @ApiResponse({ status: 200, description: 'Relatório gerado' })
  async generateClientAgreementReport(@Param('clientId') clientId: string) {
    return this.agreementsService.generateClientAgreementReport(clientId);
  }

  // ===== UTILITÁRIOS =====

  @Post('apply-discount')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Aplicar desconto automático durante agendamento' })
  @ApiResponse({ status: 200, description: 'Desconto aplicado' })
  async applyAgreementDiscount(@Body() data: { clientId: string; serviceId: string; amount: number }) {
    return this.agreementsService.applyAgreementDiscount(
      data.clientId,
      data.serviceId,
      data.amount,
    );
  }

  @Post('check-coverage')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Verificar cobertura de convênio' })
  @ApiResponse({ status: 200, description: 'Verificação de cobertura' })
  async checkAgreementCoverage(@Body() data: { agreementId: string; serviceId: string; amount: number }) {
    return this.agreementsService.checkAgreementCoverage(
      data.agreementId,
      data.serviceId,
      data.amount,
    );
  }
}
