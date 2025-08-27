import { Injectable } from '@nestjs/common';
import { HealthPlanService } from './services/health-plan.service';
import { AgreementService } from './services/agreement.service';
import { AgreementDiscountService } from './services/agreement-discount.service';
import { CoverageLimitService } from './services/coverage-limit.service';
import { AgreementPaymentService } from './services/agreement-payment.service';
import { CoverageAlertService } from './services/coverage-alert.service';
import { OperatorIntegrationService } from './services/operator-integration.service';

@Injectable()
export class AgreementsService {
  constructor(
    private readonly healthPlanService: HealthPlanService,
    private readonly agreementService: AgreementService,
    private readonly agreementDiscountService: AgreementDiscountService,
    private readonly coverageLimitService: CoverageLimitService,
    private readonly agreementPaymentService: AgreementPaymentService,
    private readonly coverageAlertService: CoverageAlertService,
    private readonly operatorIntegrationService: OperatorIntegrationService,
  ) {}

  // Métodos para gestão de planos de saúde
  async createHealthPlan(data: any) {
    return this.healthPlanService.create(data);
  }

  async updateHealthPlan(id: string, data: any) {
    return this.healthPlanService.update(id, data);
  }

  async deleteHealthPlan(id: string) {
    return this.healthPlanService.delete(id);
  }

  async getHealthPlan(id: string) {
    return this.healthPlanService.findById(id);
  }

  async getAllHealthPlans() {
    return this.healthPlanService.findAll();
  }

  // Métodos para gestão de convênios
  async createAgreement(data: any) {
    return this.agreementService.create(data);
  }

  async updateAgreement(id: string, data: any) {
    return this.agreementService.update(id, data);
  }

  async deleteAgreement(id: string) {
    return this.agreementService.delete(id);
  }

  async getAgreement(id: string) {
    return this.agreementService.findById(id);
  }

  async getClientAgreements(clientId: string) {
    return this.agreementService.findByClientId(clientId);
  }

  async getAllAgreements() {
    return this.agreementService.findAll();
  }

  // Métodos para gestão de descontos
  async createAgreementDiscount(data: any) {
    return this.agreementDiscountService.create(data);
  }

  async updateAgreementDiscount(id: string, data: any) {
    return this.agreementDiscountService.update(id, data);
  }

  async deleteAgreementDiscount(id: string) {
    return this.agreementDiscountService.delete(id);
  }

  async getAgreementDiscounts(agreementId: string) {
    return this.agreementDiscountService.findByAgreementId(agreementId);
  }

  async calculateDiscount(agreementId: string, serviceId: string, amount: number) {
    return this.agreementDiscountService.calculateDiscount(agreementId, serviceId, amount);
  }

  // Métodos para gestão de limites de cobertura
  async createCoverageLimit(data: any) {
    return this.coverageLimitService.create(data);
  }

  async updateCoverageLimit(id: string, data: any) {
    return this.coverageLimitService.update(id, data);
  }

  async deleteCoverageLimit(id: string) {
    return this.coverageLimitService.delete(id);
  }

  async getCoverageLimits(healthPlanId: string) {
    return this.coverageLimitService.findByHealthPlanId(healthPlanId);
  }

  async checkCoverageLimit(agreementId: string, serviceId: string, amount: number) {
    return this.coverageLimitService.checkLimit(agreementId, serviceId, amount);
  }

  // Métodos para gestão de pagamentos com convênios
  async createAgreementPayment(data: any) {
    return this.agreementPaymentService.create(data);
  }

  async updateAgreementPayment(id: string, data: any) {
    return this.agreementPaymentService.update(id, data);
  }

  async getAgreementPayment(id: string) {
    return this.agreementPaymentService.findById(id);
  }

  async getAgreementPayments(agreementId: string) {
    return this.agreementPaymentService.findByAgreementId(agreementId);
  }

  async processPaymentWithAgreement(paymentData: any, agreementId: string) {
    return this.agreementPaymentService.processPayment(paymentData, agreementId);
  }

  // Métodos para gestão de alertas
  async createCoverageAlert(data: any) {
    return this.coverageAlertService.create(data);
  }

  async updateCoverageAlert(id: string, data: any) {
    return this.coverageAlertService.update(id, data);
  }

  async resolveCoverageAlert(id: string) {
    return this.coverageAlertService.resolve(id);
  }

  async getCoverageAlerts(agreementId: string) {
    return this.coverageAlertService.findByAgreementId(agreementId);
  }

  async getActiveAlerts() {
    return this.coverageAlertService.findActive();
  }

  // Métodos para integração com operadoras
  async createOperatorIntegration(data: any) {
    return this.operatorIntegrationService.create(data);
  }

  async updateOperatorIntegration(id: string, data: any) {
    return this.operatorIntegrationService.update(id, data);
  }

  async deleteOperatorIntegration(id: string) {
    return this.operatorIntegrationService.delete(id);
  }

  async getOperatorIntegrations(healthPlanId: string) {
    return this.operatorIntegrationService.findByHealthPlanId(healthPlanId);
  }

  async testOperatorIntegration(id: string) {
    return this.operatorIntegrationService.testConnection(id);
  }

  // Métodos para relatórios
  async generateAgreementReport(healthPlanId: string, startDate: Date, endDate: Date) {
    const agreements = await this.agreementService.findByHealthPlanId(healthPlanId);
    const payments = await this.agreementPaymentService.findByHealthPlanId(healthPlanId, startDate, endDate);
    
    return {
      healthPlan: await this.healthPlanService.findById(healthPlanId),
      agreements: agreements.length,
      totalPayments: payments.length,
      totalAmountCovered: payments.reduce((sum, payment) => sum + Number(payment.amountCovered), 0),
      totalAmountClient: payments.reduce((sum, payment) => sum + Number(payment.amountClient), 0),
      totalDiscounts: payments.reduce((sum, payment) => sum + Number(payment.discountApplied), 0),
      payments,
    };
  }

  async generateClientAgreementReport(clientId: string) {
    const agreements = await this.agreementService.findByClientId(clientId);
    const payments = await this.agreementPaymentService.findByClientId(clientId);
    
    return {
      agreements,
      total: agreements.length,
      page: 1,
      limit: agreements.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      client: agreements[0]?.clientId,
    };
  }

  // Método para aplicar desconto automático durante agendamento
  async applyAgreementDiscount(clientId: string, serviceId: string, originalAmount: number) {
    const agreements = await this.agreementService.findActiveByClientId(clientId);
    
    if (agreements.length === 0) {
      return { discountAmount: 0, finalAmount: originalAmount, agreementId: null };
    }

    // Usar o primeiro convênio ativo (pode ser melhorado para escolher o melhor)
    const agreement = agreements[0];
    const discount = await this.agreementDiscountService.calculateDiscount(
      agreement.id,
      serviceId,
      originalAmount
    );

    return {
      discountAmount: discount.discountAmount,
      finalAmount: originalAmount - discount.discountAmount,
      agreementId: agreement.id,
      agreement: agreement,
    };
  }

  // Método para verificar limites de cobertura
  async checkAgreementCoverage(agreementId: string, serviceId: string, amount: number) {
    const limitCheck = await this.coverageLimitService.checkLimit(agreementId, serviceId, amount);
    
    if (limitCheck.isExceeded) {
      await this.coverageAlertService.create({
        agreementId,
        serviceId,
        alertType: 'LIMIT_EXCEEDED',
        message: `Limite de cobertura excedido para o serviço. Limite: ${limitCheck.limitAmount}, Valor: ${amount}`,
      });
    }

    return limitCheck;
  }
}
