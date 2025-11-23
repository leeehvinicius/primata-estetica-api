import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

// Interfaces para tipar os campos Json do IntegrationConfiguration
interface AccountingSettings {
  autoExport?: boolean;
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  [key: string]: any;
}

interface AccountingCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
  clientId?: string;
  [key: string]: any;
}

interface AccountingConfig {
  id: string;
  type: string;
  provider: string;
  settings: AccountingSettings;
  credentials: AccountingCredentials;
  isActive: boolean;
}

@Injectable()
export class AccountingIntegrationService {
  private readonly logger = new Logger(AccountingIntegrationService.name);

  constructor(
    private config: ConfigService,
    private http: HttpService,
    private prisma: PrismaService,
  ) {}

  /**
   * Gerar relatório financeiro no formato especificado
   */
  async generateFinancialReport(
    payments: any[],
    format: 'csv' | 'xml' | 'json',
  ) {
    try {
      this.logger.log(`Gerando relatório financeiro em formato ${format}`);

      // Obter configuração do sistema de contabilidade
      const accountingConfig = await this.getAccountingConfig();

      if (!accountingConfig) {
        throw new Error('Sistema de contabilidade não configurado');
      }

      // Processar dados dos pagamentos
      const processedData = this.processPaymentData(payments);

      // Gerar relatório no formato solicitado
      let report;
      switch (format) {
        case 'csv':
          report = this.generateCsvReport(processedData);
          break;
        case 'xml':
          report = this.generateXmlReport(processedData);
          break;
        case 'json':
          report = this.generateJsonReport(processedData);
          break;
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      // Enviar para sistema de contabilidade se configurado
      if (accountingConfig.settings?.autoExport) {
        await this.exportToAccountingSystem(report, format, accountingConfig);
      }

      return {
        format,
        data: report,
        recordCount: processedData.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao gerar relatório financeiro', error);
      throw error;
    }
  }

  /**
   * Exportar dados para sistema de contabilidade
   */
  async exportToAccountingSystem(data: any, format: string, config: any) {
    try {
      this.logger.log(
        `Exportando dados para sistema de contabilidade ${config.provider}`,
      );

      const headers = this.buildAccountingHeaders(config);
      const url = this.buildAccountingUrl(config, 'export');

      const response = await firstValueFrom(
        this.http.post(
          url,
          {
            data,
            format,
            timestamp: new Date().toISOString(),
          },
          { headers },
        ),
      );

      // Log da exportação
      await this.prisma.integrationLog.create({
        data: {
          type: 'ACCOUNTING_EXPORT',
          status: 'SUCCESS',
          details: {
            provider: config.provider,
            format,
            recordCount: data.length,
            response: response.data,
          },
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        'Erro na exportação para sistema de contabilidade',
        error,
      );

      // Log do erro
      await this.prisma.integrationLog.create({
        data: {
          type: 'ACCOUNTING_EXPORT',
          status: 'ERROR',
          details: {
            provider: config.provider,
            format,
            error: error.message,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Sincronizar dados com sistema de contabilidade
   */
  async syncWithAccountingSystem(period: { startDate: Date; endDate: Date }) {
    try {
      this.logger.log('Iniciando sincronização com sistema de contabilidade');

      const accountingConfig = await this.getAccountingConfig();

      if (!accountingConfig) {
        throw new Error('Sistema de contabilidade não configurado');
      }

      // Buscar dados do período
      const payments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: period.startDate,
            lte: period.endDate,
          },
          paymentStatus: 'COMPLETED' as any,
        },
        include: {
          client: true,
          appointment: {
            include: {
              service: true,
            },
          },
        },
      });

      // Processar dados
      const processedData = this.processPaymentData(payments);

      // Enviar para sincronização
      const headers = this.buildAccountingHeaders(accountingConfig);
      const url = this.buildAccountingUrl(accountingConfig, 'sync');

      const response = await firstValueFrom(
        this.http.post(
          url,
          {
            period,
            data: processedData,
            syncType: 'FULL',
          },
          { headers },
        ),
      );

      // Log da sincronização
      await this.prisma.integrationLog.create({
        data: {
          type: 'ACCOUNTING_SYNC',
          status: 'SUCCESS',
          details: {
            provider: accountingConfig.provider,
            period,
            recordCount: processedData.length,
            response: response.data,
          },
        },
      });

      return {
        success: true,
        syncedRecords: processedData.length,
        response: response.data,
      };
    } catch (error) {
      this.logger.error(
        'Erro na sincronização com sistema de contabilidade',
        error,
      );
      throw error;
    }
  }

  /**
   * Verificar status da integração
   */
  async checkStatus() {
    try {
      const configs = await this.prisma.integrationConfiguration.findMany({
        where: { type: 'ACCOUNTING', isActive: true },
      });

      const status: Array<{
        provider: string;
        status: string;
        lastTest: Date;
        details?: any;
        error?: string;
      }> = [];
      for (const config of configs) {
        try {
          const testResult = await this.testAccountingConnection(config);
          status.push({
            provider: config.provider,
            status: 'ONLINE',
            lastTest: new Date(),
            details: testResult,
          });
        } catch (error) {
          status.push({
            provider: config.provider,
            status: 'OFFLINE',
            lastTest: new Date(),
            error: error.message,
          });
        }
      }

      return {
        online: status.filter((s) => s.status === 'ONLINE').length,
        offline: status.filter((s) => s.status === 'OFFLINE').length,
        systems: status,
      };
    } catch (error) {
      this.logger.error(
        'Erro ao verificar status dos sistemas de contabilidade',
        error,
      );
      return { online: 0, offline: 0, systems: [], error: error.message };
    }
  }

  /**
   * Testar conexão com sistema de contabilidade
   */
  async testConnection() {
    try {
      const configs = await this.prisma.integrationConfiguration.findMany({
        where: { type: 'ACCOUNTING', isActive: true },
      });

      if (configs.length === 0) {
        return {
          success: false,
          message: 'Nenhum sistema de contabilidade configurado',
        };
      }

      const results: Array<{
        provider: string;
        success: boolean;
        details?: any;
        error?: string;
      }> = [];

      for (const config of configs) {
        try {
          const result = await this.testAccountingConnection(config);
          results.push({
            provider: config.provider,
            success: true,
            details: result,
          });
        } catch (error) {
          results.push({
            provider: config.provider,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: results.some((r) => r.success),
        results,
      };
    } catch (error) {
      this.logger.error('Erro no teste de conexão', error);
      return { success: false, error: error.message };
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  private async getAccountingConfig(): Promise<AccountingConfig | null> {
    const config = await this.prisma.integrationConfiguration.findFirst({
      where: {
        type: 'ACCOUNTING',
        isActive: true,
      },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      type: config.type,
      provider: config.provider,
      settings: config.settings as AccountingSettings,
      credentials: config.credentials as AccountingCredentials,
      isActive: config.isActive,
    };
  }

  private processPaymentData(payments: any[]) {
    return payments.map((payment) => ({
      id: payment.id,
      date: payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.notes || '',
      status: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      clientId: payment.clientId,
      clientName: payment.client?.name,
      clientEmail: payment.client?.email,
      appointmentId: payment.appointmentId,
      appointmentDate: payment.appointment?.scheduledDate,
      service: payment.appointment?.service
        ? {
            id: payment.appointment.service.id,
            name: payment.appointment.service.name,
            price: payment.appointment.service.price,
          }
        : null,
      metadata: {
        transactionId: payment.transactionId,
        externalPaymentId: payment.externalPaymentId,
        receiptNumber: payment.receiptNumber,
      },
    }));
  }

  private generateCsvReport(data: any[]) {
    if (data.length === 0) {
      return 'ID,Data,Valor,Moeda,Descrição,Status,Método,Cliente,Email,Agendamento\n';
    }

    const headers = [
      'ID',
      'Data',
      'Valor',
      'Moeda',
      'Descrição',
      'Status',
      'Método de Pagamento',
      'Cliente',
      'Email',
      'Agendamento',
    ].join(',');

    const rows = data.map((payment) =>
      [
        payment.id,
        payment.date,
        payment.amount,
        payment.currency,
        `"${payment.description || ''}"`,
        payment.paymentStatus,
        payment.paymentMethod,
        `"${payment.clientName || ''}"`,
        payment.clientEmail || '',
        payment.appointmentId || '',
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }

  private generateXmlReport(data: any[]) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const rootStart = '<financialReport>';
    const rootEnd = '</financialReport>';

    const paymentsXml = data
      .map(
        (payment) => `
            <payment>
                <id>${payment.id}</id>
                <date>${payment.date}</date>
                <amount>${payment.amount}</amount>
                <currency>${payment.currency}</currency>
                <description>${this.escapeXml(payment.description || '')}</description>
                <status>${payment.paymentStatus}</status>
                <paymentMethod>${payment.paymentMethod}</paymentMethod>
                <client>
                    <id>${payment.clientId}</id>
                    <name>${this.escapeXml(payment.clientName || '')}</name>
                    <email>${payment.clientEmail || ''}</email>
                </client>
                <appointment>
                    <id>${payment.appointmentId || ''}</id>
                    <date>${payment.appointmentDate || ''}</date>
                </appointment>
            </payment>
        `,
      )
      .join('');

    return `${xmlHeader}\n${rootStart}\n${paymentsXml}\n${rootEnd}`;
  }

  private generateJsonReport(data: any[]) {
    return {
      reportType: 'financial',
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
      data: data,
    };
  }

  private async testAccountingConnection(config: any) {
    const headers = this.buildAccountingHeaders(config);
    const url = this.buildAccountingUrl(config, 'test');

    const response = await firstValueFrom(this.http.get(url, { headers }));

    return response.data;
  }

  private buildAccountingHeaders(config: any) {
    const credentials = config.credentials;

    switch (config.provider) {
      case 'sage':
        return {
          Authorization: `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
          'X-Company': credentials.companyId,
        };
      case 'quickbooks':
        return {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
      case 'xero':
        return {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'Xero-tenant-id': credentials.tenantId,
        };
      case 'contabil':
        return {
          Authorization: `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
        };
      default:
        return {
          'Content-Type': 'application/json',
        };
    }
  }

  private buildAccountingUrl(config: any, action: string) {
    const settings = config.settings;

    switch (config.provider) {
      case 'sage':
        const sageBaseUrl = settings.sandbox
          ? 'https://api.sage.com/v3.1'
          : 'https://api.sage.com/v3.1';
        switch (action) {
          case 'export':
            return `${sageBaseUrl}/financial_transactions`;
          case 'sync':
            return `${sageBaseUrl}/sync`;
          case 'test':
            return `${sageBaseUrl}/company`;
          default:
            return sageBaseUrl;
        }
      case 'quickbooks':
        const qbBaseUrl = settings.sandbox
          ? 'https://sandbox-quickbooks.api.intuit.com'
          : 'https://quickbooks.api.intuit.com';
        switch (action) {
          case 'export':
            return `${qbBaseUrl}/v3/company/${settings.companyId}/transaction`;
          case 'sync':
            return `${qbBaseUrl}/v3/company/${settings.companyId}/sync`;
          case 'test':
            return `${qbBaseUrl}/v3/company/${settings.companyId}/companyinfo`;
          default:
            return qbBaseUrl;
        }
      case 'xero':
        const xeroBaseUrl = settings.sandbox
          ? 'https://api.xero.com/api.xro/2.0'
          : 'https://api.xero.com/api.xro/2.0';
        switch (action) {
          case 'export':
            return `${xeroBaseUrl}/Invoices`;
          case 'sync':
            return `${xeroBaseUrl}/Sync`;
          case 'test':
            return `${xeroBaseUrl}/Organisations`;
          default:
            return xeroBaseUrl;
        }
      case 'contabil':
        const contabilBaseUrl =
          settings.baseUrl || 'https://api.contabil.com.br';
        switch (action) {
          case 'export':
            return `${contabilBaseUrl}/v1/transactions`;
          case 'sync':
            return `${contabilBaseUrl}/v1/sync`;
          case 'test':
            return `${contabilBaseUrl}/v1/status`;
          default:
            return contabilBaseUrl;
        }
      default:
        throw new Error(
          `Sistema de contabilidade não suportado: ${config.provider}`,
        );
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
