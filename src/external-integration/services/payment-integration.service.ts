import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentIntegrationService {
    private readonly logger = new Logger(PaymentIntegrationService.name);

    constructor(
        private config: ConfigService,
        private http: HttpService,
        private prisma: PrismaService,
    ) {}

    /**
     * Processar pagamento através de gateway externo
     */
    async processPayment(paymentData: {
        amount: number;
        currency: string;
        description: string;
        clientId: string;
        appointmentId?: string;
        paymentMethod: string;
        metadata?: any;
        internalPaymentId: string;
    }) {
        try {
            this.logger.log(`Processando pagamento ${paymentData.internalPaymentId} via gateway externo`);

            // Obter configuração do gateway
            const gatewayConfig = await this.getPaymentGatewayConfig(paymentData.paymentMethod);
            
            if (!gatewayConfig) {
                throw new Error(`Gateway não configurado para método ${paymentData.paymentMethod}`);
            }

            // Preparar dados para o gateway
            const gatewayData = this.prepareGatewayData(paymentData, gatewayConfig);

            // Enviar para o gateway
            const response = await this.sendToGateway(gatewayConfig, gatewayData);

            // Processar resposta
            const result = this.processGatewayResponse(response, gatewayConfig.provider);

            // Salvar log da transação
            await this.prisma.paymentTransactionLog.create({
                data: {
                    paymentId: paymentData.internalPaymentId,
                    gateway: gatewayConfig.provider,
                    gatewayTransactionId: result.externalId,
                    requestData: gatewayData,
                    responseData: response,
                    status: result.status,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                },
            });

            return result;
        } catch (error) {
            this.logger.error('Erro no processamento do pagamento', error);
            
            // Log do erro
            await this.prisma.paymentTransactionLog.create({
                data: {
                    paymentId: paymentData.internalPaymentId,
                    gateway: 'UNKNOWN',
                    requestData: paymentData,
                    responseData: { error: error.message },
                    status: 'FAILED',
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                },
            });

            throw error;
        }
    }

    /**
     * Reembolsar pagamento
     */
    async refundPayment(paymentId: string, amount?: number, reason?: string) {
        try {
            this.logger.log(`Processando reembolso para pagamento ${paymentId}`);

            // Buscar pagamento
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
                include: { transactionLogs: true },
            });

            if (!payment) {
                throw new Error('Pagamento não encontrado');
            }

            if (!payment.externalPaymentId) {
                throw new Error('Pagamento não possui ID externo para reembolso');
            }

            // Obter configuração do gateway
            const gatewayConfig = await this.getPaymentGatewayConfig(payment.paymentMethod);
            
            if (!gatewayConfig) {
                throw new Error('Gateway não configurado');
            }

            // Preparar dados do reembolso
            const refundData = {
                transactionId: payment.externalPaymentId,
                amount: amount || payment.amount,
                reason: reason || 'Reembolso solicitado',
                currency: payment.currency,
            };

            // Enviar reembolso para o gateway
            const response = await this.sendRefundToGateway(gatewayConfig, refundData);

            // Processar resposta
            const result = this.processRefundResponse(response, gatewayConfig.provider);

            // Atualizar status do pagamento
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: result.status === 'SUCCESS' ? 'REFUNDED' : 'REFUND_FAILED',
                    refundedAt: new Date(),
                    refundAmount: amount || payment.amount,
                },
            });

            // Log da transação
            await this.prisma.paymentTransactionLog.create({
                data: {
                    paymentId,
                    gateway: gatewayConfig.provider,
                    gatewayTransactionId: result.externalId,
                    requestData: refundData,
                    responseData: response,
                    status: result.status,
                    transactionType: 'REFUND',
                    amount: amount || payment.amount,
                    currency: payment.currency,
                },
            });

            return result;
        } catch (error) {
            this.logger.error('Erro no processamento do reembolso', error);
            throw error;
        }
    }

    /**
     * Verificar status de pagamento
     */
    async checkPaymentStatus(paymentId: string) {
        try {
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
            });

            if (!payment || !payment.externalPaymentId) {
                throw new Error('Pagamento não encontrado ou sem ID externo');
            }

            const gatewayConfig = await this.getPaymentGatewayConfig(payment.paymentMethod);
            
            if (!gatewayConfig) {
                throw new Error('Gateway não configurado');
            }

            const response = await this.checkStatusWithGateway(gatewayConfig, payment.externalPaymentId);
            return this.processStatusResponse(response, gatewayConfig.provider);
        } catch (error) {
            this.logger.error('Erro ao verificar status do pagamento', error);
            throw error;
        }
    }

    /**
     * Verificar status da integração
     */
    async checkStatus() {
        try {
            const configs = await this.prisma.integrationConfiguration.findMany({
                where: { type: 'PAYMENT', isActive: true },
            });

            const status = [];
            for (const config of configs) {
                try {
                    const testResult = await this.testGatewayConnection(config);
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
                online: status.filter(s => s.status === 'ONLINE').length,
                offline: status.filter(s => s.status === 'OFFLINE').length,
                gateways: status,
            };
        } catch (error) {
            this.logger.error('Erro ao verificar status dos gateways', error);
            return { online: 0, offline: 0, gateways: [], error: error.message };
        }
    }

    /**
     * Testar conexão com gateway
     */
    async testConnection() {
        try {
            const configs = await this.prisma.integrationConfiguration.findMany({
                where: { type: 'PAYMENT', isActive: true },
            });

            if (configs.length === 0) {
                return { success: false, message: 'Nenhum gateway configurado' };
            }

            const results = [];
            for (const config of configs) {
                try {
                    const result = await this.testGatewayConnection(config);
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
                success: results.some(r => r.success),
                results,
            };
        } catch (error) {
            this.logger.error('Erro no teste de conexão', error);
            return { success: false, error: error.message };
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    private async getPaymentGatewayConfig(paymentMethod: string) {
        // Mapear método de pagamento para gateway
        const methodToGateway: Record<string, string> = {
            'CREDIT_CARD': 'stripe',
            'DEBIT_CARD': 'stripe',
            'PIX': 'mercadopago',
            'BANK_TRANSFER': 'mercadopago',
            'PAYPAL': 'paypal',
        };

        const provider = methodToGateway[paymentMethod];
        if (!provider) {
            throw new Error(`Método de pagamento não suportado: ${paymentMethod}`);
        }

        return await this.prisma.integrationConfiguration.findFirst({
            where: {
                type: 'PAYMENT',
                provider,
                isActive: true,
            },
        });
    }

    private prepareGatewayData(paymentData: any, gatewayConfig: any) {
        const baseData = {
            amount: paymentData.amount,
            currency: paymentData.currency,
            description: paymentData.description,
            metadata: {
                ...paymentData.metadata,
                internalPaymentId: paymentData.internalPaymentId,
                clientId: paymentData.clientId,
                appointmentId: paymentData.appointmentId,
            },
        };

        // Adaptar dados conforme o gateway
        switch (gatewayConfig.provider) {
            case 'stripe':
                return {
                    ...baseData,
                    amount: Math.round(baseData.amount * 100), // Stripe usa centavos
                    payment_method_types: ['card'],
                };
            case 'mercadopago':
                return {
                    ...baseData,
                    payment_method_id: paymentData.paymentMethod,
                    payer: {
                        email: paymentData.metadata?.clientEmail,
                    },
                };
            case 'paypal':
                return {
                    ...baseData,
                    intent: 'CAPTURE',
                    payment_source: {
                        card: {
                            // Dados do cartão
                        },
                    },
                };
            default:
                return baseData;
        }
    }

    private async sendToGateway(gatewayConfig: any, data: any) {
        const headers = this.buildGatewayHeaders(gatewayConfig);
        const url = this.buildGatewayUrl(gatewayConfig, 'payment');

        try {
            const response = await firstValueFrom(
                this.http.post(url, data, { headers })
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Erro na comunicação com gateway ${gatewayConfig.provider}`, error);
            throw new Error(`Falha na comunicação com gateway: ${error.message}`);
        }
    }

    private async sendRefundToGateway(gatewayConfig: any, data: any) {
        const headers = this.buildGatewayHeaders(gatewayConfig);
        const url = this.buildGatewayUrl(gatewayConfig, 'refund');

        try {
            const response = await firstValueFrom(
                this.http.post(url, data, { headers })
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Erro no reembolso via gateway ${gatewayConfig.provider}`, error);
            throw new Error(`Falha no reembolso: ${error.message}`);
        }
    }

    private async checkStatusWithGateway(gatewayConfig: any, transactionId: string) {
        const headers = this.buildGatewayHeaders(gatewayConfig);
        const url = this.buildGatewayUrl(gatewayConfig, 'status', transactionId);

        try {
            const response = await firstValueFrom(
                this.http.get(url, { headers })
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao verificar status via gateway ${gatewayConfig.provider}`, error);
            throw new Error(`Falha ao verificar status: ${error.message}`);
        }
    }

    private async testGatewayConnection(config: any) {
        const headers = this.buildGatewayHeaders(config);
        const url = this.buildGatewayUrl(config, 'test');

        try {
            const response = await firstValueFrom(
                this.http.get(url, { headers })
            );
            return response.data;
        } catch (error) {
            throw new Error(`Teste de conexão falhou: ${error.message}`);
        }
    }

    private buildGatewayHeaders(config: any) {
        const credentials = config.credentials;
        
        switch (config.provider) {
            case 'stripe':
                return {
                    'Authorization': `Bearer ${credentials.secretKey}`,
                    'Content-Type': 'application/json',
                };
            case 'mercadopago':
                return {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                };
            case 'paypal':
                return {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json',
                };
            default:
                return {
                    'Content-Type': 'application/json',
                };
        }
    }

    private buildGatewayUrl(config: any, action: string, transactionId?: string) {
        const settings = config.settings;
        
        switch (config.provider) {
            case 'stripe':
                const baseUrl = settings.sandbox ? 'https://api.stripe.com/v1' : 'https://api.stripe.com/v1';
                switch (action) {
                    case 'payment': return `${baseUrl}/payment_intents`;
                    case 'refund': return `${baseUrl}/refunds`;
                    case 'status': return `${baseUrl}/payment_intents/${transactionId}`;
                    case 'test': return `${baseUrl}/balance`;
                    default: return baseUrl;
                }
            case 'mercadopago':
                const mpBaseUrl = settings.sandbox ? 'https://api.mercadopago.com' : 'https://api.mercadopago.com';
                switch (action) {
                    case 'payment': return `${mpBaseUrl}/v1/payments`;
                    case 'refund': return `${mpBaseUrl}/v1/payments/${transactionId}/refunds`;
                    case 'status': return `${mpBaseUrl}/v1/payments/${transactionId}`;
                    case 'test': return `${mpBaseUrl}/users/me`;
                    default: return mpBaseUrl;
                }
            case 'paypal':
                const ppBaseUrl = settings.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
                switch (action) {
                    case 'payment': return `${ppBaseUrl}/v2/checkout/orders`;
                    case 'refund': return `${ppBaseUrl}/v2/payments/captures/${transactionId}/refund`;
                    case 'status': return `${ppBaseUrl}/v2/checkout/orders/${transactionId}`;
                    case 'test': return `${ppBaseUrl}/v1/identity/oauth2/userinfo`;
                    default: return ppBaseUrl;
                }
            default:
                throw new Error(`Gateway não suportado: ${config.provider}`);
        }
    }

    private processGatewayResponse(response: any, provider: string) {
        switch (provider) {
            case 'stripe':
                return {
                    externalId: response.id,
                    status: response.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
                    gatewayResponse: response,
                };
            case 'mercadopago':
                return {
                    externalId: response.id.toString(),
                    status: response.status === 'approved' ? 'COMPLETED' : 'PENDING',
                    gatewayResponse: response,
                };
            case 'paypal':
                return {
                    externalId: response.id,
                    status: response.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
                    gatewayResponse: response,
                };
            default:
                return {
                    externalId: response.id || response.transaction_id,
                    status: 'PENDING',
                    gatewayResponse: response,
                };
        }
    }

    private processRefundResponse(response: any, provider: string) {
        switch (provider) {
            case 'stripe':
                return {
                    externalId: response.id,
                    status: response.status === 'succeeded' ? 'SUCCESS' : 'FAILED',
                    gatewayResponse: response,
                };
            case 'mercadopago':
                return {
                    externalId: response.id.toString(),
                    status: response.status === 'approved' ? 'SUCCESS' : 'FAILED',
                    gatewayResponse: response,
                };
            case 'paypal':
                return {
                    externalId: response.id,
                    status: response.status === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
                    gatewayResponse: response,
                };
            default:
                return {
                    externalId: response.id || response.refund_id,
                    status: 'SUCCESS',
                    gatewayResponse: response,
                };
        }
    }

    private processStatusResponse(response: any, provider: string) {
        switch (provider) {
            case 'stripe':
                return {
                    status: response.status === 'succeeded' ? 'COMPLETED' : response.status.toUpperCase(),
                    amount: response.amount / 100,
                    currency: response.currency,
                    gatewayResponse: response,
                };
            case 'mercadopago':
                return {
                    status: response.status === 'approved' ? 'COMPLETED' : response.status.toUpperCase(),
                    amount: response.transaction_amount,
                    currency: response.currency_id,
                    gatewayResponse: response,
                };
            case 'paypal':
                return {
                    status: response.status === 'COMPLETED' ? 'COMPLETED' : response.status,
                    amount: response.amount?.value,
                    currency: response.amount?.currency_code,
                    gatewayResponse: response,
                };
            default:
                return {
                    status: response.status || 'UNKNOWN',
                    amount: response.amount,
                    currency: response.currency,
                    gatewayResponse: response,
                };
        }
    }
}
