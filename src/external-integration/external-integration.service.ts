import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentIntegrationService } from './services/payment-integration.service';
import { AccountingIntegrationService } from './services/accounting-integration.service';
import { CrmIntegrationService } from './services/crm-integration.service';
import { WebhookService } from './services/webhook.service';
import { ApiIntegrationService } from './services/api-integration.service';

@Injectable()
export class ExternalIntegrationService {
  private readonly logger = new Logger(ExternalIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private paymentIntegration: PaymentIntegrationService,
    private accountingIntegration: AccountingIntegrationService,
    private crmIntegration: CrmIntegrationService,
    private webhookService: WebhookService,
    private apiIntegration: ApiIntegrationService,
  ) {}

  /**
   * Processar pagamento através de sistema externo
   */
  async processPayment(paymentData: {
    amount: number;
    currency: string;
    description: string;
    clientId: string;
    serviceId?: string;
    appointmentId?: string;
    paymentMethod: string;
    metadata?: any;
  }) {
    try {
      this.logger.log(
        `Processando pagamento para cliente ${paymentData.clientId}`,
      );

      // Criar registro de pagamento no banco
      const payment = await this.prisma.payment.create({
        data: {
          clientId: paymentData.clientId,
          serviceId: paymentData.serviceId || 'default-service-id', // Você precisa definir um serviceId padrão
          appointmentId: paymentData.appointmentId,
          amount: paymentData.amount,
          partnerDiscount: 0, // Valor padrão
          clientDiscount: 0, // Valor padrão
          finalAmount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod as any, // Cast para o enum correto
          paymentStatus: 'PENDING', // Status padrão
          paymentDate: new Date(),
          dueDate: new Date(),
          notes: paymentData.description || null,
          transactionId: null,
          receiptNumber: null,
          createdBy: 'system', // Você precisa definir quem está criando
        },
      });

      // Processar através do sistema de pagamento externo
      const externalPayment = await this.paymentIntegration.processPayment({
        ...paymentData,
        internalPaymentId: payment.id,
      });

      // Atualizar status do pagamento
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: externalPayment.status as any,
          transactionId: externalPayment.externalId,
          updatedAt: new Date(),
        },
      });

      // Enviar webhook se configurado
      await this.webhookService.sendPaymentWebhook(payment.id, externalPayment);

      return {
        success: true,
        paymentId: payment.id,
        externalPaymentId: externalPayment.externalId,
        status: externalPayment.status,
      };
    } catch (error) {
      this.logger.error('Erro ao processar pagamento', error);
      throw new Error('Falha no processamento do pagamento');
    }
  }

  /**
   * Exportar relatórios financeiros para sistema de contabilidade
   */
  async exportFinancialReports(period: {
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'xml' | 'json';
  }) {
    try {
      this.logger.log(
        `Exportando relatórios financeiros para ${period.startDate} até ${period.endDate}`,
      );

      // Buscar dados financeiros do período
      const payments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: period.startDate,
            lte: period.endDate,
          },
          paymentStatus: 'PAID',
        },
        include: {
          client: true,
          appointment: true,
        },
      });

      // Gerar relatório no formato solicitado
      const report = await this.accountingIntegration.generateFinancialReport(
        payments,
        period.format,
      );

      // Salvar histórico de exportação
      await this.prisma.integrationLog.create({
        data: {
          type: 'FINANCIAL_EXPORT',
          status: 'SUCCESS',
          details: {
            period,
            recordCount: payments.length,
            format: period.format,
          },
        },
      });

      return {
        success: true,
        report,
        recordCount: payments.length,
      };
    } catch (error) {
      this.logger.error('Erro ao exportar relatórios financeiros', error);

      // Log do erro
      await this.prisma.integrationLog.create({
        data: {
          type: 'FINANCIAL_EXPORT',
          status: 'ERROR',
          details: {
            period,
            error: error.message,
          },
        },
      });

      throw new Error('Falha na exportação dos relatórios financeiros');
    }
  }

  /**
   * Sincronizar dados de clientes com CRM
   */
  async syncClientsWithCrm(clientIds?: string[]) {
    try {
      this.logger.log('Iniciando sincronização de clientes com CRM');

      // Buscar clientes para sincronizar
      const whereClause = clientIds ? { id: { in: clientIds } } : {};
      const clients = await this.prisma.client.findMany({
        where: whereClause,
        include: {
          appointments: {
            include: {
              service: true,
              payments: true,
            },
          },
        },
      });

      let syncedCount = 0;
      const errors: any[] = [];

      for (const client of clients) {
        try {
          // Sincronizar cliente com CRM
          await this.crmIntegration.syncClient(client);
          syncedCount++;

          // Marcar como sincronizado
          await this.prisma.client.update({
            where: { id: client.id },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          errors.push({
            clientId: client.id,
            error: error.message,
          });
        }
      }

      // Log da sincronização
      await this.prisma.integrationLog.create({
        data: {
          type: 'CRM_SYNC',
          status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
          details: {
            totalClients: clients.length,
            syncedCount,
            errors,
          },
        },
      });

      return {
        success: true,
        totalClients: clients.length,
        syncedCount,
        errors,
      };
    } catch (error) {
      this.logger.error('Erro na sincronização com CRM', error);
      throw new Error('Falha na sincronização com CRM');
    }
  }

  /**
   * Verificar status das integrações
   */
  async checkIntegrationStatus() {
    try {
      const status = {
        payment: await this.paymentIntegration.checkStatus(),
        accounting: await this.accountingIntegration.checkStatus(),
        crm: await this.crmIntegration.checkStatus(),
        webhooks: await this.webhookService.checkStatus(),
      };

      return {
        success: true,
        status,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao verificar status das integrações', error);
      throw new Error('Falha ao verificar status das integrações');
    }
  }

  /**
   * Configurar integração externa
   */
  async configureIntegration(config: {
    type: 'PAYMENT' | 'ACCOUNTING' | 'CRM' | 'WEBHOOK';
    provider: string;
    credentials: any;
    settings: any;
  }) {
    try {
      this.logger.log(
        `Configurando integração ${config.type} com ${config.provider}`,
      );

      // Salvar configuração
      const integration = await this.prisma.integrationConfiguration.upsert({
        where: {
          type_provider: {
            type: config.type,
            provider: config.provider,
          },
        },
        update: {
          credentials: config.credentials,
          settings: config.settings,
          updatedAt: new Date(),
        },
        create: {
          type: config.type,
          provider: config.provider,
          credentials: config.credentials,
          settings: config.settings,
          isActive: true,
        },
      });

      // Testar conexão
      let testResult;
      switch (config.type) {
        case 'PAYMENT':
          testResult = await this.paymentIntegration.testConnection();
          break;
        case 'ACCOUNTING':
          testResult = await this.accountingIntegration.testConnection();
          break;
        case 'CRM':
          testResult = await this.crmIntegration.testConnection();
          break;
        case 'WEBHOOK':
          testResult = await this.webhookService.testConnection();
          break;
      }

      return {
        success: true,
        integrationId: integration.id,
        testResult,
      };
    } catch (error) {
      this.logger.error('Erro ao configurar integração', error);
      throw new Error('Falha na configuração da integração');
    }
  }

  /**
   * Obter logs de integração
   */
  async getIntegrationLogs(filters: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      const whereClause: any = {};

      if (filters.type) whereClause.type = filters.type;
      if (filters.status) whereClause.status = filters.status;
      if (filters.startDate || filters.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
        if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
      }

      const logs = await this.prisma.integrationLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
      });

      return {
        success: true,
        logs,
        total: logs.length,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar logs de integração', error);
      throw new Error('Falha ao buscar logs de integração');
    }
  }

  // Métodos adicionais para o controller
  async refundPayment(paymentId: string, amount?: number) {
    return this.paymentIntegration.refundPayment(paymentId, amount);
  }

  async checkPaymentStatus(paymentId: string) {
    return this.paymentIntegration.checkPaymentStatus(paymentId);
  }

  async syncWithAccountingSystem(syncData: any) {
    return this.accountingIntegration.syncWithAccountingSystem(syncData);
  }

  async importFromCrm(importData: any) {
    return this.crmIntegration.importFromCrm(importData);
  }

  async getClientFromCrm(clientId: string) {
    return this.crmIntegration.getClientFromCrm(clientId);
  }

  async processIncomingWebhook(webhookData: any, signature?: string) {
    return this.webhookService.processIncomingWebhook(webhookData, signature);
  }

  async sendCustomWebhook(eventType: string, data: any, config?: any) {
    return this.webhookService.sendCustomWebhook(eventType, data, config);
  }

  async makeApiRequest(requestData: any) {
    return this.apiIntegration.makeApiRequest(requestData);
  }

  async syncDataWithApi(syncData: any) {
    return this.apiIntegration.syncDataWithApi(syncData);
  }

  async importDataFromApi(importData: any) {
    return this.apiIntegration.importDataFromApi(importData);
  }

  async checkApiStatus(integrationId: string) {
    return this.apiIntegration.checkApiStatus(integrationId);
  }

  async testApiConnection(integrationId: string) {
    return this.apiIntegration.testApiConnection(integrationId);
  }

  async getApiUsageStats(integrationId: string, period: any) {
    return this.apiIntegration.getApiUsageStats(integrationId, period);
  }

  async testPaymentConnection() {
    return this.paymentIntegration.testConnection();
  }

  async testAccountingConnection() {
    return this.accountingIntegration.testConnection();
  }

  async testCrmConnection() {
    return this.crmIntegration.testConnection();
  }

  async testWebhookConnection() {
    return this.webhookService.testConnection();
  }
}
