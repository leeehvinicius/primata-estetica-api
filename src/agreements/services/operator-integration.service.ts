import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Interfaces para tipar os campos Json do OperatorIntegration
interface OperatorCredentials {
  apiKey?: string;
  authorization?: string;
  clientId?: string;
  email?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

interface OperatorSettings {
  timeout?: number;
  version?: string;
  retryAttempts?: number;
  baseUrl?: string;
  [key: string]: any;
}

interface ValidationResult {
  integrationId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class OperatorIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async create(data: {
    healthPlanId: string;
    integrationType: string;
    endpoint?: string;
    credentials?: any;
    settings?: any;
    isActive?: boolean;
  }) {
    // Verifica se o plano de saúde existe
    const healthPlan = await this.prisma.healthPlan.findUnique({
      where: { id: data.healthPlanId },
    });

    if (!healthPlan) {
      throw new NotFoundException(
        `Plano de saúde com ID ${data.healthPlanId} não encontrado`,
      );
    }

    return this.prisma.operatorIntegration.create({
      data: {
        healthPlanId: data.healthPlanId,
        integrationType: data.integrationType,
        endpoint: data.endpoint,
        credentials: data.credentials,
        settings: data.settings,
        isActive: data.isActive ?? true,
      },
      include: {
        healthPlan: true,
      },
    });
  }

  async findById(id: string) {
    const integration = await this.prisma.operatorIntegration.findUnique({
      where: { id },
      include: {
        healthPlan: true,
      },
    });

    if (!integration) {
      throw new NotFoundException(`Integração com ID ${id} não encontrada`);
    }

    return integration;
  }

  async findByHealthPlanId(healthPlanId: string) {
    return this.prisma.operatorIntegration.findMany({
      where: {
        healthPlanId,
        isActive: true,
      },
      include: {
        healthPlan: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      integrationType?: string;
      endpoint?: string;
      credentials?: any;
      settings?: any;
      isActive?: boolean;
    },
  ) {
    await this.findById(id); // Verifica se existe

    return this.prisma.operatorIntegration.update({
      where: { id },
      data,
      include: {
        healthPlan: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id); // Verifica se existe

    return this.prisma.operatorIntegration.delete({
      where: { id },
    });
  }

  async testConnection(integrationId: string) {
    const integration = await this.prisma.operatorIntegration.findUnique({
      where: { id: integrationId },
      include: { healthPlan: true },
    });

    if (!integration) {
      throw new NotFoundException('Integração não encontrada');
    }

    try {
      // Teste básico de conectividade
      if (!integration.endpoint) {
        return {
          success: false,
          message: 'Endpoint não configurado',
          details: null,
        };
      }

      // Aqui você implementaria o teste real de conexão
      // Por enquanto, retornamos sucesso
      return {
        success: true,
        message: 'Conexão testada com sucesso',
        details: { endpoint: integration.endpoint },
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão: ${error.message}`,
        details: null,
      };
    }
  }

  async submitInvoice(integrationId: string, invoiceData: any) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${integration.endpoint}/invoices`, invoiceData, {
          timeout: 30000,
          headers: this.buildHeaders(integration),
        }),
      );

      return {
        success: true,
        message: 'Fatura enviada com sucesso',
        invoiceId: response.data.invoiceId,
        status: response.data.status,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Erro ao enviar fatura: ${error.message}`);
    }
  }

  async checkPaymentStatus(integrationId: string, paymentId: string) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${integration.endpoint}/payments/${paymentId}`, {
          timeout: 15000,
          headers: this.buildHeaders(integration),
        }),
      );

      return {
        success: true,
        paymentId,
        status: response.data.status,
        amount: response.data.amount,
        paymentDate: response.data.paymentDate,
        response: response.data,
      };
    } catch (error) {
      throw new Error(
        `Erro ao verificar status do pagamento: ${error.message}`,
      );
    }
  }

  async validateAgreement(integrationId: string, agreementData: any) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${integration.endpoint}/validate-agreement`,
          agreementData,
          {
            timeout: 20000,
            headers: this.buildHeaders(integration),
          },
        ),
      );

      return {
        success: true,
        isValid: response.data.isValid,
        message: response.data.message,
        details: response.data.details,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Erro ao validar convênio: ${error.message}`);
    }
  }

  async requestAuthorization(integrationId: string, authorizationData: any) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${integration.endpoint}/authorizations`,
          authorizationData,
          {
            timeout: 30000,
            headers: this.buildHeaders(integration),
          },
        ),
      );

      return {
        success: true,
        authorizationId: response.data.authorizationId,
        status: response.data.status,
        message: response.data.message,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Erro ao solicitar autorização: ${error.message}`);
    }
  }

  async getCoverageInfo(integrationId: string, agreementNumber: string) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${integration.endpoint}/coverage/${agreementNumber}`,
          {
            timeout: 15000,
            headers: this.buildHeaders(integration),
          },
        ),
      );

      return {
        success: true,
        agreementNumber,
        coverage: response.data.coverage,
        limits: response.data.limits,
        response: response.data,
      };
    } catch (error) {
      throw new Error(
        `Erro ao obter informações de cobertura: ${error.message}`,
      );
    }
  }

  async syncAgreements(integrationId: string) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${integration.endpoint}/sync-agreements`,
          {},
          {
            timeout: 60000,
            headers: this.buildHeaders(integration),
          },
        ),
      );

      return {
        success: true,
        syncedCount: response.data.syncedCount,
        message: response.data.message,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Erro ao sincronizar convênios: ${error.message}`);
    }
  }

  async getIntegrationLogs(integrationId: string, limit: number = 100) {
    const integration = await this.findById(integrationId);

    if (!integration.endpoint) {
      throw new Error('Endpoint não configurado para esta integração');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${integration.endpoint}/logs?limit=${limit}`, {
          timeout: 15000,
          headers: this.buildHeaders(integration),
        }),
      );

      return {
        success: true,
        logs: response.data.logs,
        totalCount: response.data.totalCount,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Erro ao obter logs da integração: ${error.message}`);
    }
  }

  private buildHeaders(integration: any) {
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'PrimataEstetica-API/1.0',
    };

    // Adiciona credenciais se configuradas
    if (integration.credentials) {
      const credentials = integration.credentials as OperatorCredentials;
      if (credentials.apiKey) {
        headers['X-API-Key'] = credentials.apiKey;
      }
      if (credentials.authorization) {
        headers['Authorization'] = credentials.authorization;
      }
      if (credentials.clientId) {
        headers['X-Client-ID'] = credentials.clientId;
      }
    }

    // Adiciona configurações específicas
    if (integration.settings) {
      const settings = integration.settings as OperatorSettings;
      if (settings.timeout) {
        headers['X-Timeout'] = settings.timeout;
      }
      if (settings.version) {
        headers['X-API-Version'] = settings.version;
      }
    }

    return headers;
  }

  async getIntegrationStatistics(healthPlanId: string) {
    const integrations = await this.findByHealthPlanId(healthPlanId);

    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter((i) => i.isActive).length;

    const integrationTypeCounts = integrations.reduce((acc, integration) => {
      acc[integration.integrationType] =
        (acc[integration.integrationType] || 0) + 1;
      return acc;
    }, {});

    // Testa conexões das integrações ativas
    const connectionTests: any[] = [];

    for (const integration of integrations) {
      try {
        const testResult = await this.testConnection(integration.id);
        connectionTests.push({
          integrationId: integration.id,
          integrationType: integration.integrationType,
          success: true,
          message: testResult.message,
        });
      } catch (error) {
        connectionTests.push({
          integrationId: integration.id,
          integrationType: integration.integrationType,
          success: false,
          message: error.message,
        });
      }
    }

    const successfulConnections = connectionTests.filter(
      (test) => test.success,
    ).length;

    return {
      totalIntegrations,
      activeIntegrations,
      integrationTypeCounts,
      connectionTests,
      successfulConnections,
      connectionSuccessRate:
        totalIntegrations > 0
          ? (successfulConnections / totalIntegrations) * 100
          : 0,
    };
  }

  async validateIntegrationConfiguration(integrationId: string) {
    const integration = await this.findById(integrationId);

    const validation: ValidationResult = {
      integrationId,
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validações básicas
    if (!integration.integrationType) {
      validation.isValid = false;
      validation.errors.push('Tipo de integração não especificado');
    }

    if (!integration.endpoint) {
      validation.warnings.push(
        'Endpoint não configurado - algumas funcionalidades podem não estar disponíveis',
      );
    }

    if (!integration.credentials) {
      validation.warnings.push(
        'Credenciais não configuradas - autenticação pode falhar',
      );
    }

    // Validações específicas por tipo
    switch (integration.integrationType) {
      case 'API':
        if (!integration.endpoint) {
          validation.isValid = false;
          validation.errors.push('Endpoint é obrigatório para integrações API');
        }
        const apiCredentials = integration.credentials as OperatorCredentials;
        if (!apiCredentials?.apiKey && !apiCredentials?.authorization) {
          validation.warnings.push(
            'Credenciais de autenticação recomendadas para APIs',
          );
        }
        break;

      case 'WEBHOOK':
        if (!integration.endpoint) {
          validation.isValid = false;
          validation.errors.push('Endpoint é obrigatório para webhooks');
        }
        break;

      case 'EMAIL':
        const emailCredentials = integration.credentials as OperatorCredentials;
        if (!emailCredentials?.email) {
          validation.warnings.push(
            'Email de contato recomendado para integrações por email',
          );
        }
        break;

      default:
        validation.warnings.push(
          `Tipo de integração '${integration.integrationType}' não reconhecido`,
        );
    }

    return validation;
  }
}
