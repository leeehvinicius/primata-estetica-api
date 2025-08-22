import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
        private config: ConfigService,
        private http: HttpService,
        private prisma: PrismaService,
    ) {}

    /**
     * Enviar webhook de pagamento
     */
    async sendPaymentWebhook(paymentId: string, paymentData: any) {
        try {
            this.logger.log(`Enviando webhook de pagamento ${paymentId}`);

            const webhookConfigs = await this.getWebhookConfigs('PAYMENT');
            
            if (webhookConfigs.length === 0) {
                this.logger.debug('Nenhum webhook configurado para pagamentos');
                return;
            }

            const webhookData = this.preparePaymentWebhookData(paymentId, paymentData);

            const results = [];
            for (const config of webhookConfigs) {
                try {
                    const result = await this.sendWebhook(config, webhookData);
                    results.push({
                        url: config.settings.url,
                        success: true,
                        response: result,
                    });
                } catch (error) {
                    results.push({
                        url: config.settings.url,
                        success: false,
                        error: error.message,
                    });
                }
            }

            // Log dos webhooks enviados
            await this.logWebhookDelivery('PAYMENT', paymentId, results);

            return {
                success: true,
                sent: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
            };
        } catch (error) {
            this.logger.error('Erro ao enviar webhook de pagamento', error);
            throw error;
        }
    }

    /**
     * Enviar webhook de agendamento
     */
    async sendAppointmentWebhook(appointmentId: string, appointmentData: any, event: string) {
        try {
            this.logger.log(`Enviando webhook de agendamento ${appointmentId} - ${event}`);

            const webhookConfigs = await this.getWebhookConfigs('APPOINTMENT');
            
            if (webhookConfigs.length === 0) {
                this.logger.debug('Nenhum webhook configurado para agendamentos');
                return;
            }

            const webhookData = this.prepareAppointmentWebhookData(appointmentId, appointmentData, event);

            const results = [];
            for (const config of webhookConfigs) {
                try {
                    const result = await this.sendWebhook(config, webhookData);
                    results.push({
                        url: config.settings.url,
                        success: true,
                        response: result,
                    });
                } catch (error) {
                    results.push({
                        url: config.settings.url,
                        success: false,
                        error: error.message,
                    });
                }
            }

            // Log dos webhooks enviados
            await this.logWebhookDelivery('APPOINTMENT', appointmentId, results);

            return {
                success: true,
                sent: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
            };
        } catch (error) {
            this.logger.error('Erro ao enviar webhook de agendamento', error);
            throw error;
        }
    }

    /**
     * Enviar webhook de cliente
     */
    async sendClientWebhook(clientId: string, clientData: any, event: string) {
        try {
            this.logger.log(`Enviando webhook de cliente ${clientId} - ${event}`);

            const webhookConfigs = await this.getWebhookConfigs('CLIENT');
            
            if (webhookConfigs.length === 0) {
                this.logger.debug('Nenhum webhook configurado para clientes');
                return;
            }

            const webhookData = this.prepareClientWebhookData(clientId, clientData, event);

            const results = [];
            for (const config of webhookConfigs) {
                try {
                    const result = await this.sendWebhook(config, webhookData);
                    results.push({
                        url: config.settings.url,
                        success: true,
                        response: result,
                    });
                } catch (error) {
                    results.push({
                        url: config.settings.url,
                        success: false,
                        error: error.message,
                    });
                }
            }

            // Log dos webhooks enviados
            await this.logWebhookDelivery('CLIENT', clientId, results);

            return {
                success: true,
                sent: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
            };
        } catch (error) {
            this.logger.error('Erro ao enviar webhook de cliente', error);
            throw error;
        }
    }

    /**
     * Enviar webhook customizado
     */
    async sendCustomWebhook(type: string, data: any, event: string) {
        try {
            this.logger.log(`Enviando webhook customizado ${type} - ${event}`);

            const webhookConfigs = await this.getWebhookConfigs(type);
            
            if (webhookConfigs.length === 0) {
                this.logger.debug(`Nenhum webhook configurado para ${type}`);
                return;
            }

            const webhookData = {
                type,
                event,
                timestamp: new Date().toISOString(),
                data,
            };

            const results = [];
            for (const config of webhookConfigs) {
                try {
                    const result = await this.sendWebhook(config, webhookData);
                    results.push({
                        url: config.settings.url,
                        success: true,
                        response: result,
                    });
                } catch (error) {
                    results.push({
                        url: config.settings.url,
                        success: false,
                        error: error.message,
                    });
                }
            }

            // Log dos webhooks enviados
            await this.logWebhookDelivery(type, 'custom', results);

            return {
                success: true,
                sent: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
            };
        } catch (error) {
            this.logger.error('Erro ao enviar webhook customizado', error);
            throw error;
        }
    }

    /**
     * Processar webhook recebido
     */
    async processIncomingWebhook(webhookData: any, signature?: string) {
        try {
            this.logger.log('Processando webhook recebido');

            // Verificar assinatura se configurado
            if (signature && !this.verifyWebhookSignature(webhookData, signature)) {
                throw new Error('Assinatura do webhook inválida');
            }

            // Log do webhook recebido
            await this.logIncomingWebhook(webhookData);

            // Processar webhook baseado no tipo
            const { type, event, data } = webhookData;

            switch (type) {
                case 'PAYMENT_UPDATE':
                    await this.processPaymentUpdate(data);
                    break;
                case 'APPOINTMENT_UPDATE':
                    await this.processAppointmentUpdate(data);
                    break;
                case 'CLIENT_UPDATE':
                    await this.processClientUpdate(data);
                    break;
                default:
                    this.logger.warn(`Tipo de webhook não suportado: ${type}`);
            }

            return {
                success: true,
                processed: true,
                type,
                event,
            };
        } catch (error) {
            this.logger.error('Erro ao processar webhook recebido', error);
            throw error;
        }
    }

    /**
     * Verificar status da integração
     */
    async checkStatus() {
        try {
            const configs = await this.prisma.integrationConfiguration.findMany({
                where: { type: 'WEBHOOK', isActive: true },
            });

            const status = [];
            for (const config of configs) {
                try {
                    const testResult = await this.testWebhookConnection(config);
                    status.push({
                        url: config.settings.url,
                        status: 'ONLINE',
                        lastTest: new Date(),
                        details: testResult,
                    });
                } catch (error) {
                    status.push({
                        url: config.settings.url,
                        status: 'OFFLINE',
                        lastTest: new Date(),
                        error: error.message,
                    });
                }
            }

            return {
                online: status.filter(s => s.status === 'ONLINE').length,
                offline: status.filter(s => s.status === 'OFFLINE').length,
                webhooks: status,
            };
        } catch (error) {
            this.logger.error('Erro ao verificar status dos webhooks', error);
            return { online: 0, offline: 0, webhooks: [], error: error.message };
        }
    }

    /**
     * Testar conexão com webhook
     */
    async testConnection() {
        try {
            const configs = await this.prisma.integrationConfiguration.findMany({
                where: { type: 'WEBHOOK', isActive: true },
            });

            if (configs.length === 0) {
                return { success: false, message: 'Nenhum webhook configurado' };
            }

            const results = [];
            for (const config of configs) {
                try {
                    const result = await this.testWebhookConnection(config);
                    results.push({
                        url: config.settings.url,
                        success: true,
                        details: result,
                    });
                } catch (error) {
                    results.push({
                        url: config.settings.url,
                        success: false,
                        error: error.message,
                    });
                }
            }

            return {
                success: results.some(r => r.success),
                results,
            };
        } catch (error) {
            this.logger.error('Erro no teste de conexão', error);
            return { success: false, error: error.message };
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    private async getWebhookConfigs(type: string) {
        return await this.prisma.integrationConfiguration.findMany({
            where: {
                type: 'WEBHOOK',
                isActive: true,
                settings: {
                    path: ['types'],
                    array_contains: [type],
                },
            },
        });
    }

    private preparePaymentWebhookData(paymentId: string, paymentData: any) {
        return {
            type: 'PAYMENT',
            event: 'PAYMENT_PROCESSED',
            timestamp: new Date().toISOString(),
            data: {
                paymentId,
                externalPaymentId: paymentData.externalId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                status: paymentData.status,
                paymentMethod: paymentData.paymentMethod,
                clientId: paymentData.clientId,
                appointmentId: paymentData.appointmentId,
                processedAt: paymentData.processedAt,
            },
        };
    }

    private prepareAppointmentWebhookData(appointmentId: string, appointmentData: any, event: string) {
        return {
            type: 'APPOINTMENT',
            event,
            timestamp: new Date().toISOString(),
            data: {
                appointmentId,
                clientId: appointmentData.clientId,
                scheduledDate: appointmentData.scheduledDate,
                status: appointmentData.status,
                services: appointmentData.services,
                professionalId: appointmentData.professionalId,
                notes: appointmentData.notes,
            },
        };
    }

    private prepareClientWebhookData(clientId: string, clientData: any, event: string) {
        return {
            type: 'CLIENT',
            event,
            timestamp: new Date().toISOString(),
            data: {
                clientId,
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address,
                city: clientData.city,
                state: clientData.state,
                zipCode: clientData.zipCode,
                registrationDate: clientData.createdAt,
            },
        };
    }

    private async sendWebhook(config: any, data: any) {
        const headers = this.buildWebhookHeaders(config);
        const url = config.settings.url;

        const response = await firstValueFrom(
            this.http.post(url, data, { 
                headers,
                timeout: config.settings.timeout || 10000,
            })
        );

        return response.data;
    }

    private async testWebhookConnection(config: any) {
        const headers = this.buildWebhookHeaders(config);
        const url = config.settings.url;

        const testData = {
            type: 'TEST',
            event: 'CONNECTION_TEST',
            timestamp: new Date().toISOString(),
            data: {
                message: 'Teste de conexão webhook',
                configId: config.id,
            },
        };

        const response = await firstValueFrom(
            this.http.post(url, testData, { 
                headers,
                timeout: 5000,
            })
        );

        return response.data;
    }

    private buildWebhookHeaders(config: any) {
        const headers: any = {
            'Content-Type': 'application/json',
            'User-Agent': 'PrimataEstetica-Webhook/1.0',
        };

        // Adicionar headers customizados se configurados
        if (config.settings.customHeaders) {
            Object.assign(headers, config.settings.customHeaders);
        }

        // Adicionar autenticação se configurada
        if (config.credentials?.apiKey) {
            headers['X-API-Key'] = config.credentials.apiKey;
        }

        if (config.credentials?.bearerToken) {
            headers['Authorization'] = `Bearer ${config.credentials.bearerToken}`;
        }

        return headers;
    }

    private verifyWebhookSignature(data: any, signature: string): boolean {
        // Implementar verificação de assinatura HMAC
        const secret = this.config.get<string>('WEBHOOK_SECRET');
        if (!secret) {
            this.logger.warn('WEBHOOK_SECRET não configurado, pulando verificação de assinatura');
            return true;
        }

        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(data))
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    private async logWebhookDelivery(type: string, resourceId: string, results: any[]) {
        await this.prisma.integrationLog.create({
            data: {
                type: 'WEBHOOK_OUTBOUND',
                status: results.some(r => r.success) ? 'SUCCESS' : 'ERROR',
                details: {
                    webhookType: type,
                    resourceId,
                    results,
                },
            },
        });
    }

    private async logIncomingWebhook(webhookData: any) {
        await this.prisma.integrationLog.create({
            data: {
                type: 'WEBHOOK_INBOUND',
                status: 'SUCCESS',
                details: {
                    webhookData,
                    receivedAt: new Date().toISOString(),
                },
            },
        });
    }

    private async processPaymentUpdate(data: any) {
        // Atualizar status do pagamento no sistema
        if (data.paymentId && data.status) {
            await this.prisma.payment.update({
                where: { id: data.paymentId },
                data: {
                    status: data.status,
                    updatedAt: new Date(),
                },
            });
        }
    }

    private async processAppointmentUpdate(data: any) {
        // Atualizar status do agendamento no sistema
        if (data.appointmentId && data.status) {
            await this.prisma.appointment.update({
                where: { id: data.appointmentId },
                data: {
                    status: data.status,
                    updatedAt: new Date(),
                },
            });
        }
    }

    private async processClientUpdate(data: any) {
        // Atualizar dados do cliente no sistema
        if (data.clientId) {
            const updateData: any = {};
            
            if (data.name) updateData.name = data.name;
            if (data.email) updateData.email = data.email;
            if (data.phone) updateData.phone = data.phone;
            if (data.address) updateData.address = data.address;
            if (data.city) updateData.city = data.city;
            if (data.state) updateData.state = data.state;
            if (data.zipCode) updateData.zipCode = data.zipCode;

            if (Object.keys(updateData).length > 0) {
                updateData.updatedAt = new Date();
                
                await this.prisma.client.update({
                    where: { id: data.clientId },
                    data: updateData,
                });
            }
        }
    }
}
