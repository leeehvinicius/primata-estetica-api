import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

// Interfaces para tipar os campos Json do IntegrationConfiguration
interface CrmSettings {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  [key: string]: any;
}

interface CrmCredentials {
  apiKey?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  [key: string]: any;
}

interface CrmConfig {
  id: string;
  type: string;
  provider: string;
  settings: CrmSettings;
  credentials: CrmCredentials;
  isActive: boolean;
}

@Injectable()
export class CrmIntegrationService {
  private readonly logger = new Logger(CrmIntegrationService.name);

  constructor(
    private config: ConfigService,
    private http: HttpService,
    private prisma: PrismaService,
  ) {}

  /**
   * Sincronizar cliente com sistema CRM
   */
  async syncClient(client: any) {
    try {
      this.logger.log(`Sincronizando cliente ${client.id} com CRM`);

      // Obter configuração do CRM
      const crmConfig = await this.getCrmConfig();

      if (!crmConfig) {
        throw new Error('Sistema CRM não configurado');
      }

      // Preparar dados do cliente para o CRM
      const crmData = this.prepareClientData(client);

      // Verificar se cliente já existe no CRM
      if (!client.email) {
        throw new Error('Cliente não possui email cadastrado');
      }
      const existingContact = await this.findContactInCrm(
        client.email,
        crmConfig,
      );

      if (existingContact) {
        // Atualizar cliente existente
        await this.updateContactInCrm(existingContact.id, crmData, crmConfig);
      } else {
        // Criar novo cliente no CRM
        await this.createContactInCrm(crmData, crmConfig);
      }

      // Sincronizar histórico de agendamentos
      await this.syncAppointmentHistory(client, crmConfig);

      // Sincronizar dados de pagamento
      await this.syncPaymentHistory(client, crmConfig);

      return {
        success: true,
        clientId: client.id,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Erro na sincronização do cliente ${client.id}`, error);
      throw error;
    }
  }

  /**
   * Sincronizar múltiplos clientes
   */
  async syncMultipleClients(clientIds: string[]) {
    try {
      this.logger.log(`Sincronizando ${clientIds.length} clientes com CRM`);

      const clients = await this.prisma.client.findMany({
        where: { id: { in: clientIds } },
        include: {
          appointments: {
            include: {
              service: true,
              payments: true,
            },
          },
        },
      });

      const results: Array<{
        clientId: string;
        success: boolean;
        result?: any;
        error?: string;
      }> = [];
      for (const client of clients) {
        try {
          const result = await this.syncClient(client);
          results.push({
            clientId: client.id,
            success: true,
            result,
          });
        } catch (error) {
          results.push({
            clientId: client.id,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        totalClients: clients.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      this.logger.error('Erro na sincronização múltipla de clientes', error);
      throw error;
    }
  }

  /**
   * Importar dados do CRM
   */
  async importFromCrm(filters?: {
    lastSync?: Date;
    status?: string;
    tags?: string[];
  }) {
    try {
      this.logger.log('Importando dados do CRM');

      const crmConfig = await this.getCrmConfig();

      if (!crmConfig) {
        throw new Error('Sistema CRM não configurado');
      }

      // Buscar contatos do CRM
      const crmContacts = await this.fetchContactsFromCrm(filters, crmConfig);

      const imported: any[] = [];
      const updated: any[] = [];
      const errors: any[] = [];

      for (const contact of crmContacts) {
        try {
          // Verificar se cliente já existe no sistema
          const existingClient = await this.prisma.client.findFirst({
            where: { email: contact.email },
          });

          if (existingClient) {
            // Atualizar cliente existente
            await this.updateClientFromCrm(existingClient.id, contact);
            updated.push(contact.id);
          } else {
            // Criar novo cliente
            await this.createClientFromCrm(contact);
            imported.push(contact.id);
          }
        } catch (error) {
          errors.push({
            contactId: contact.id,
            error: error.message,
          });
        }
      }

      // Log da importação
      await this.prisma.integrationLog.create({
        data: {
          type: 'CRM_IMPORT',
          status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
          details: {
            imported: imported.length,
            updated: updated.length,
            errors: errors.length,
            filters,
          },
        },
      });

      return {
        success: true,
        imported: imported.length,
        updated: updated.length,
        errors: errors.length,
        total: crmContacts.length,
      };
    } catch (error) {
      this.logger.error('Erro na importação do CRM', error);
      throw error;
    }
  }

  /**
   * Buscar informações do cliente no CRM
   */
  async getClientFromCrm(clientId: string) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      const crmConfig = await this.getCrmConfig();

      if (!crmConfig) {
        throw new Error('Sistema CRM não configurado');
      }

      // Buscar dados completos do CRM
      if (!client.email) {
        throw new Error('Cliente não possui email cadastrado');
      }
      const crmData = await this.fetchContactDetailsFromCrm(
        client.email,
        crmConfig,
      );

      return {
        success: true,
        clientId,
        crmData,
        lastSync: (client as any).lastCrmSync,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar cliente ${clientId} no CRM`, error);
      throw error;
    }
  }

  /**
   * Verificar status da integração
   */
  async checkStatus() {
    try {
      const configs = await this.prisma.integrationConfiguration.findMany({
        where: { type: 'CRM', isActive: true },
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
          const testResult = await this.testCrmConnection(config);
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
      this.logger.error('Erro ao verificar status dos sistemas CRM', error);
      return { online: 0, offline: 0, systems: [], error: error.message };
    }
  }

  /**
   * Testar conexão com CRM
   */
  async testConnection() {
    try {
      const configs = await this.prisma.integrationConfiguration.findMany({
        where: { type: 'CRM', isActive: true },
      });

      if (configs.length === 0) {
        return { success: false, message: 'Nenhum sistema CRM configurado' };
      }

      const results: Array<{
        provider: string;
        success: boolean;
        details?: any;
        error?: string;
      }> = [];
      for (const config of configs) {
        try {
          const result = await this.testCrmConnection(config);
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

  private async getCrmConfig() {
    return await this.prisma.integrationConfiguration.findFirst({
      where: {
        type: 'CRM',
        isActive: true,
      },
    });
  }

  private prepareClientData(client: any) {
    return {
      firstName: client.name?.split(' ')[0] || '',
      lastName: client.name?.split(' ').slice(1).join(' ') || '',
      email: client.email,
      phone: client.phone,
      address: {
        street: client.address,
        city: client.city,
        state: client.state,
        zipCode: client.zipCode,
        country: client.country || 'Brasil',
      },
      customFields: {
        clientId: client.id,
        registrationDate: client.createdAt,
        lastAppointment: client.appointments?.[0]?.scheduledDate,
        totalAppointments: client.appointments?.length || 0,
        totalSpent:
          client.appointments?.reduce(
            (sum: number, apt: any) =>
              sum +
              (apt.payments?.reduce(
                (pSum: number, p: any) => pSum + p.amount,
                0,
              ) || 0),
            0,
          ) || 0,
      },
      tags: this.generateClientTags(client),
    };
  }

  private generateClientTags(client: any) {
    const tags = ['Cliente Estética'];

    // Tags baseadas no histórico
    if (client.appointments?.length > 0) {
      tags.push('Agendamento Ativo');
    }

    if (client.appointments?.length > 5) {
      tags.push('Cliente Frequente');
    }

    // Tags baseadas em pagamentos
    const totalSpent =
      client.appointments?.reduce(
        (sum: number, apt: any) =>
          sum +
          (apt.payments?.reduce((pSum: number, p: any) => pSum + p.amount, 0) ||
            0),
        0,
      ) || 0;

    if (totalSpent > 1000) {
      tags.push('Alto Valor');
    }

    return tags;
  }

  private async findContactInCrm(email: string, config: any) {
    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'search', undefined, { email });

    try {
      const response = await firstValueFrom(this.http.get(url, { headers }));
      return response.data?.contacts?.[0] || null;
    } catch (error) {
      this.logger.warn(`Contato não encontrado no CRM: ${email}`);
      return null;
    }
  }

  private async createContactInCrm(contactData: any, config: any) {
    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'contacts');

    const response = await firstValueFrom(
      this.http.post(url, { contact: contactData }, { headers }),
    );

    return response.data;
  }

  private async updateContactInCrm(
    contactId: string,
    contactData: any,
    config: any,
  ) {
    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'contacts', contactId);

    const response = await firstValueFrom(
      this.http.put(url, { contact: contactData }, { headers }),
    );

    return response.data;
  }

  private async syncAppointmentHistory(client: any, config: any) {
    if (!client.appointments?.length) return;

    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'activities');

    const activities = client.appointments.map((apt: any) => ({
      type: 'appointment',
      subject: `Agendamento - ${apt.services?.map((s: any) => s.name).join(', ')}`,
      description: `Agendamento realizado em ${apt.scheduledDate}`,
      date: apt.scheduledDate,
      contactId: client.id,
      customFields: {
        appointmentId: apt.id,
        status: apt.status,
        services: apt.services?.map((s: any) => s.name),
      },
    }));

    for (const activity of activities) {
      try {
        await firstValueFrom(this.http.post(url, { activity }, { headers }));
      } catch (error) {
        this.logger.warn(`Erro ao sincronizar atividade: ${error.message}`);
      }
    }
  }

  private async syncPaymentHistory(client: any, config: any) {
    const payments =
      client.appointments?.flatMap((apt: any) => apt.payments || []) || [];
    if (!payments.length) return;

    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'deals');

    for (const payment of payments) {
      try {
        const dealData = {
          name: `Pagamento - ${payment.description}`,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status === 'COMPLETED' ? 'won' : 'pending',
          contactId: client.id,
          customFields: {
            paymentId: payment.id,
            appointmentId: payment.appointmentId,
            paymentMethod: payment.paymentMethod,
          },
        };

        await firstValueFrom(
          this.http.post(url, { deal: dealData }, { headers }),
        );
      } catch (error) {
        this.logger.warn(`Erro ao sincronizar pagamento: ${error.message}`);
      }
    }
  }

  private async fetchContactsFromCrm(filters: any, config: any) {
    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'contacts', undefined, filters);

    const response = await firstValueFrom(this.http.get(url, { headers }));

    return response.data?.contacts || [];
  }

  private async fetchContactDetailsFromCrm(email: string, config: any) {
    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'contacts', undefined, { email });

    const response = await firstValueFrom(this.http.get(url, { headers }));

    return response.data?.contacts?.[0] || null;
  }

  private async updateClientFromCrm(clientId: string, crmContact: any) {
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        name: `${crmContact.firstName} ${crmContact.lastName}`.trim(),
        email: crmContact.email,
        phone: crmContact.phone,
        address: crmContact.address?.street,
        city: crmContact.address?.city,
        state: crmContact.address?.state,
        zipCode: crmContact.address?.zipCode,
        // lastCrmSync: new Date(), // Campo não existe no modelo Client
      },
    });
  }

  private async createClientFromCrm(crmContact: any) {
    await this.prisma.client.create({
      data: {
        name: `${crmContact.firstName} ${crmContact.lastName}`.trim(),
        email: crmContact.email,
        phone: crmContact.phone,
        address: crmContact.address?.street,
        city: crmContact.address?.city,
        state: crmContact.address?.state,
        zipCode: crmContact.address?.zipCode,
        // lastCrmSync: new Date(), // Campo não existe no modelo Client
      },
    });
  }

  private async testCrmConnection(config: any) {
    const headers = this.buildCrmHeaders(config);
    const url = this.buildCrmUrl(config, 'test');

    const response = await firstValueFrom(this.http.get(url, { headers }));

    return response.data;
  }

  private buildCrmHeaders(config: any) {
    const credentials = config.credentials;

    switch (config.provider) {
      case 'hubspot':
        return {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        };
      case 'salesforce':
        return {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        };
      case 'pipedrive':
        return {
          Authorization: `Bearer ${credentials.apiToken}`,
          'Content-Type': 'application/json',
        };
      case 'zoho':
        return {
          Authorization: `Zoho-oauthtoken ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        };
      default:
        return {
          'Content-Type': 'application/json',
        };
    }
  }

  private buildCrmUrl(config: any, action: string, id?: string, params?: any) {
    const settings = config.settings;

    switch (config.provider) {
      case 'hubspot':
        const hubspotBaseUrl = 'https://api.hubapi.com';
        switch (action) {
          case 'contacts':
            return id
              ? `${hubspotBaseUrl}/crm/v3/objects/contacts/${id}`
              : `${hubspotBaseUrl}/crm/v3/objects/contacts`;
          case 'search':
            return `${hubspotBaseUrl}/crm/v3/objects/contacts/search`;
          case 'activities':
            return `${hubspotBaseUrl}/crm/v3/objects/contacts/${id}/associations/activities`;
          case 'deals':
            return `${hubspotBaseUrl}/crm/v3/objects/deals`;
          case 'test':
            return `${hubspotBaseUrl}/crm/v3/objects/contacts`;
          default:
            return hubspotBaseUrl;
        }
      case 'salesforce':
        const sfBaseUrl = settings.instanceUrl;
        switch (action) {
          case 'contacts':
            return id
              ? `${sfBaseUrl}/services/data/v52.0/sobjects/Contact/${id}`
              : `${sfBaseUrl}/services/data/v52.0/sobjects/Contact`;
          case 'search':
            return `${sfBaseUrl}/services/data/v52.0/query?q=SELECT+Id+FROM+Contact+WHERE+Email='${params?.email || ''}'`;
          case 'activities':
            return `${sfBaseUrl}/services/data/v52.0/sobjects/Task`;
          case 'deals':
            return `${sfBaseUrl}/services/data/v52.0/sobjects/Opportunity`;
          case 'test':
            return `${sfBaseUrl}/services/data/v52.0/sobjects/Contact`;
          default:
            return sfBaseUrl;
        }
      case 'pipedrive':
        const pdBaseUrl = `https://${settings.domain}.pipedrive.com/api/v1`;
        switch (action) {
          case 'contacts':
            return id ? `${pdBaseUrl}/persons/${id}` : `${pdBaseUrl}/persons`;
          case 'search':
            return `${pdBaseUrl}/persons/search?term=${params?.email || ''}`;
          case 'activities':
            return `${pdBaseUrl}/activities`;
          case 'deals':
            return `${pdBaseUrl}/deals`;
          case 'test':
            return `${pdBaseUrl}/persons`;
          default:
            return pdBaseUrl;
        }
      case 'zoho':
        const zohoBaseUrl = 'https://www.zohoapis.com/crm/v2';
        switch (action) {
          case 'contacts':
            return id
              ? `${zohoBaseUrl}/Contacts/${id}`
              : `${zohoBaseUrl}/Contacts`;
          case 'search':
            return `${zohoBaseUrl}/Contacts/search`;
          case 'activities':
            return `${zohoBaseUrl}/Tasks`;
          case 'deals':
            return `${zohoBaseUrl}/Deals`;
          case 'test':
            return `${zohoBaseUrl}/Contacts`;
          default:
            return zohoBaseUrl;
        }
      default:
        throw new Error(`CRM não suportado: ${config.provider}`);
    }
  }
}
