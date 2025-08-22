import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiIntegrationService {
    private readonly logger = new Logger(ApiIntegrationService.name);

    constructor(
        private config: ConfigService,
        private http: HttpService,
        private prisma: PrismaService,
    ) {}

    /**
     * Fazer requisição para API externa
     */
    async makeApiRequest(config: {
        integrationId: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        endpoint: string;
        data?: any;
        headers?: any;
        params?: any;
    }) {
        try {
            this.logger.log(`Fazendo requisição para API externa: ${config.method} ${config.endpoint}`);

            // Obter configuração da integração
            const integrationConfig = await this.prisma.integrationConfiguration.findUnique({
                where: { id: config.integrationId },
            });

            if (!integrationConfig || !integrationConfig.isActive) {
                throw new Error('Integração não encontrada ou inativa');
            }

            // Construir URL completa
            const baseUrl = integrationConfig.settings.baseUrl;
            const url = `${baseUrl}${config.endpoint}`;

            // Construir headers
            const headers = this.buildApiHeaders(integrationConfig, config.headers);

            // Fazer requisição
            const response = await this.makeHttpRequest(
                config.method,
                url,
                config.data,
                headers,
                config.params
            );

            // Log da requisição
            await this.logApiRequest(config, response, integrationConfig);

            return {
                success: true,
                status: response.status,
                data: response.data,
                headers: response.headers,
            };
        } catch (error) {
            this.logger.error('Erro na requisição para API externa', error);
            
            // Log do erro
            await this.logApiRequest(config, null, null, error);

            throw error;
        }
    }

    /**
     * Sincronizar dados com API externa
     */
    async syncDataWithApi(syncConfig: {
        integrationId: string;
        dataType: string;
        data: any[];
        syncMode: 'CREATE' | 'UPDATE' | 'UPSERT';
        batchSize?: number;
    }) {
        try {
            this.logger.log(`Sincronizando ${syncConfig.data.length} registros com API externa`);

            const integrationConfig = await this.prisma.integrationConfiguration.findUnique({
                where: { id: syncConfig.integrationId },
            });

            if (!integrationConfig || !integrationConfig.isActive) {
                throw new Error('Integração não encontrada ou inativa');
            }

            const batchSize = syncConfig.batchSize || 100;
            const batches = this.chunkArray(syncConfig.data, batchSize);

            const results = {
                total: syncConfig.data.length,
                successful: 0,
                failed: 0,
                errors: [],
            };

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                this.logger.log(`Processando lote ${i + 1}/${batches.length} (${batch.length} registros)`);

                try {
                    const batchResult = await this.processBatch(
                        integrationConfig,
                        syncConfig.dataType,
                        batch,
                        syncConfig.syncMode
                    );

                    results.successful += batchResult.successful;
                    results.failed += batchResult.failed;
                    results.errors.push(...batchResult.errors);
                } catch (error) {
                    results.failed += batch.length;
                    results.errors.push({
                        batch: i + 1,
                        error: error.message,
                    });
                }
            }

            // Log da sincronização
            await this.logSyncOperation(syncConfig, results);

            return {
                success: true,
                results,
            };
        } catch (error) {
            this.logger.error('Erro na sincronização com API externa', error);
            throw error;
        }
    }

    /**
     * Importar dados de API externa
     */
    async importDataFromApi(importConfig: {
        integrationId: string;
        dataType: string;
        endpoint: string;
        filters?: any;
        transformFunction?: string;
    }) {
        try {
            this.logger.log(`Importando dados de API externa: ${importConfig.dataType}`);

            const integrationConfig = await this.prisma.integrationConfiguration.findUnique({
                where: { id: importConfig.integrationId },
            });

            if (!integrationConfig || !integrationConfig.isActive) {
                throw new Error('Integração não encontrada ou inativa');
            }

            // Fazer requisição para obter dados
            const response = await this.makeApiRequest({
                integrationId: importConfig.integrationId,
                method: 'GET',
                endpoint: importConfig.endpoint,
                params: importConfig.filters,
            });

            if (!response.success) {
                throw new Error('Falha ao obter dados da API externa');
            }

            // Transformar dados se necessário
            let transformedData = response.data;
            if (importConfig.transformFunction) {
                transformedData = this.transformData(response.data, importConfig.transformFunction);
            }

            // Processar dados importados
            const importResult = await this.processImportedData(
                importConfig.dataType,
                transformedData
            );

            // Log da importação
            await this.logImportOperation(importConfig, importResult);

            return {
                success: true,
                imported: importResult.imported,
                updated: importResult.updated,
                errors: importResult.errors,
                total: transformedData.length,
            };
        } catch (error) {
            this.logger.error('Erro na importação de API externa', error);
            throw error;
        }
    }

    /**
     * Verificar status da integração
     */
    async checkApiStatus(integrationId: string) {
        try {
            const integrationConfig = await this.prisma.integrationConfiguration.findUnique({
                where: { id: integrationId },
            });

            if (!integrationConfig) {
                throw new Error('Integração não encontrada');
            }

            // Fazer requisição de teste
            const testResponse = await this.makeApiRequest({
                integrationId,
                method: 'GET',
                endpoint: integrationConfig.settings.healthEndpoint || '/health',
            });

            return {
                success: true,
                status: 'ONLINE',
                responseTime: testResponse.responseTime,
                lastCheck: new Date(),
                details: testResponse.data,
            };
        } catch (error) {
            this.logger.error(`Erro ao verificar status da API ${integrationId}`, error);
            return {
                success: false,
                status: 'OFFLINE',
                lastCheck: new Date(),
                error: error.message,
            };
        }
    }

    /**
     * Testar conexão com API
     */
    async testApiConnection(integrationId: string) {
        try {
            const integrationConfig = await this.prisma.integrationConfiguration.findUnique({
                where: { id: integrationId },
            });

            if (!integrationConfig) {
                throw new Error('Integração não encontrada');
            }

            // Teste básico de conectividade
            const testResponse = await this.makeApiRequest({
                integrationId,
                method: 'GET',
                endpoint: integrationConfig.settings.testEndpoint || '/',
            });

            return {
                success: true,
                message: 'Conexão com API estabelecida com sucesso',
                details: testResponse.data,
            };
        } catch (error) {
            this.logger.error(`Erro no teste de conexão com API ${integrationId}`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Obter estatísticas de uso da API
     */
    async getApiUsageStats(integrationId: string, period?: { startDate: Date; endDate: Date }) {
        try {
            const whereClause: any = {
                type: 'API_REQUEST',
                details: {
                    path: ['integrationId'],
                    equals: integrationId,
                },
            };

            if (period) {
                whereClause.createdAt = {
                    gte: period.startDate,
                    lte: period.endDate,
                };
            }

            const logs = await this.prisma.integrationLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
            });

            const stats = {
                totalRequests: logs.length,
                successfulRequests: logs.filter(log => log.status === 'SUCCESS').length,
                failedRequests: logs.filter(log => log.status === 'ERROR').length,
                averageResponseTime: this.calculateAverageResponseTime(logs),
                requestsByMethod: this.groupRequestsByMethod(logs),
                requestsByEndpoint: this.groupRequestsByEndpoint(logs),
                errors: this.extractErrors(logs),
            };

            return {
                success: true,
                stats,
                period,
            };
        } catch (error) {
            this.logger.error('Erro ao obter estatísticas de uso da API', error);
            throw error;
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    private async makeHttpRequest(
        method: string,
        url: string,
        data?: any,
        headers?: any,
        params?: any
    ) {
        const startTime = Date.now();

        const config: any = {
            headers,
            timeout: 30000,
        };

        if (params) {
            config.params = params;
        }

        let response;
        switch (method.toUpperCase()) {
            case 'GET':
                response = await firstValueFrom(this.http.get(url, config));
                break;
            case 'POST':
                response = await firstValueFrom(this.http.post(url, data, config));
                break;
            case 'PUT':
                response = await firstValueFrom(this.http.put(url, data, config));
                break;
            case 'DELETE':
                response = await firstValueFrom(this.http.delete(url, config));
                break;
            case 'PATCH':
                response = await firstValueFrom(this.http.patch(url, data, config));
                break;
            default:
                throw new Error(`Método HTTP não suportado: ${method}`);
        }

        const responseTime = Date.now() - startTime;

        return {
            status: response.status,
            data: response.data,
            headers: response.headers,
            responseTime,
        };
    }

    private buildApiHeaders(integrationConfig: any, customHeaders?: any) {
        const headers: any = {
            'Content-Type': 'application/json',
            'User-Agent': 'PrimataEstetica-API-Integration/1.0',
        };

        // Adicionar headers da configuração
        if (integrationConfig.settings.defaultHeaders) {
            Object.assign(headers, integrationConfig.settings.defaultHeaders);
        }

        // Adicionar autenticação
        if (integrationConfig.credentials?.apiKey) {
            headers['X-API-Key'] = integrationConfig.credentials.apiKey;
        }

        if (integrationConfig.credentials?.bearerToken) {
            headers['Authorization'] = `Bearer ${integrationConfig.credentials.bearerToken}`;
        }

        if (integrationConfig.credentials?.basicAuth) {
            const { username, password } = integrationConfig.credentials.basicAuth;
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }

        // Adicionar headers customizados
        if (customHeaders) {
            Object.assign(headers, customHeaders);
        }

        return headers;
    }

    private async processBatch(
        integrationConfig: any,
        dataType: string,
        batch: any[],
        syncMode: string
    ) {
        const results = {
            successful: 0,
            failed: 0,
            errors: [],
        };

        for (const item of batch) {
            try {
                const endpoint = this.buildEndpoint(integrationConfig.settings.endpoints, dataType, syncMode);
                
                const method = syncMode === 'CREATE' ? 'POST' : 
                              syncMode === 'UPDATE' ? 'PUT' : 'POST';

                const response = await this.makeHttpRequest(
                    method,
                    `${integrationConfig.settings.baseUrl}${endpoint}`,
                    item,
                    this.buildApiHeaders(integrationConfig)
                );

                if (response.status >= 200 && response.status < 300) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push({
                        item: item.id || 'unknown',
                        error: `HTTP ${response.status}`,
                    });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    item: item.id || 'unknown',
                    error: error.message,
                });
            }
        }

        return results;
    }

    private buildEndpoint(endpoints: any, dataType: string, syncMode: string): string {
        if (endpoints && endpoints[dataType]) {
            return endpoints[dataType];
        }

        // Endpoints padrão
        const defaultEndpoints: Record<string, string> = {
            'clients': '/clients',
            'appointments': '/appointments',
            'payments': '/payments',
            'services': '/services',
        };

        return defaultEndpoints[dataType] || `/${dataType}`;
    }

    private async processImportedData(dataType: string, data: any[]) {
        const results = {
            imported: 0,
            updated: 0,
            errors: [],
        };

        for (const item of data) {
            try {
                switch (dataType) {
                    case 'clients':
                        await this.processClientImport(item, results);
                        break;
                    case 'appointments':
                        await this.processAppointmentImport(item, results);
                        break;
                    case 'payments':
                        await this.processPaymentImport(item, results);
                        break;
                    default:
                        this.logger.warn(`Tipo de dados não suportado: ${dataType}`);
                }
            } catch (error) {
                results.errors.push({
                    item: item.id || 'unknown',
                    error: error.message,
                });
            }
        }

        return results;
    }

    private async processClientImport(clientData: any, results: any) {
        const existingClient = await this.prisma.client.findFirst({
            where: { email: clientData.email },
        });

        if (existingClient) {
            await this.prisma.client.update({
                where: { id: existingClient.id },
                data: {
                    name: clientData.name,
                    phone: clientData.phone,
                    address: clientData.address,
                    city: clientData.city,
                    state: clientData.state,
                    zipCode: clientData.zipCode,
                },
            });
            results.updated++;
        } else {
            await this.prisma.client.create({
                data: {
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone,
                    address: clientData.address,
                    city: clientData.city,
                    state: clientData.state,
                    zipCode: clientData.zipCode,
                },
            });
            results.imported++;
        }
    }

    private async processAppointmentImport(appointmentData: any, results: any) {
        // Implementar lógica de importação de agendamentos
        results.imported++;
    }

    private async processPaymentImport(paymentData: any, results: any) {
        // Implementar lógica de importação de pagamentos
        results.imported++;
    }

    private transformData(data: any, transformFunction: string) {
        try {
            // Implementar transformação de dados baseada na função especificada
            // Por segurança, isso deve ser limitado a transformações predefinidas
            const transformations: Record<string, (data: any) => any> = {
                'uppercase_names': (data) => {
                    if (Array.isArray(data)) {
                        return data.map(item => ({
                            ...item,
                            name: item.name?.toUpperCase(),
                        }));
                    }
                    return data;
                },
                'format_dates': (data) => {
                    if (Array.isArray(data)) {
                        return data.map(item => ({
                            ...item,
                            createdAt: new Date(item.createdAt).toISOString(),
                            updatedAt: new Date(item.updatedAt).toISOString(),
                        }));
                    }
                    return data;
                },
            };

            const transform = transformations[transformFunction];
            if (transform) {
                return transform(data);
            }

            return data;
        } catch (error) {
            this.logger.error('Erro na transformação de dados', error);
            return data;
        }
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    private async logApiRequest(config: any, response: any, integrationConfig?: any, error?: any) {
        await this.prisma.integrationLog.create({
            data: {
                type: 'API_REQUEST',
                status: error ? 'ERROR' : 'SUCCESS',
                details: {
                    integrationId: config.integrationId,
                    method: config.method,
                    endpoint: config.endpoint,
                    requestData: config.data,
                    responseData: response?.data,
                    responseTime: response?.responseTime,
                    error: error?.message,
                },
            },
        });
    }

    private async logSyncOperation(syncConfig: any, results: any) {
        await this.prisma.integrationLog.create({
            data: {
                type: 'API_SYNC',
                status: results.failed === 0 ? 'SUCCESS' : 'PARTIAL',
                details: {
                    integrationId: syncConfig.integrationId,
                    dataType: syncConfig.dataType,
                    syncMode: syncConfig.syncMode,
                    results,
                },
            },
        });
    }

    private async logImportOperation(importConfig: any, results: any) {
        await this.prisma.integrationLog.create({
            data: {
                type: 'API_IMPORT',
                status: results.errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
                details: {
                    integrationId: importConfig.integrationId,
                    dataType: importConfig.dataType,
                    endpoint: importConfig.endpoint,
                    results,
                },
            },
        });
    }

    private calculateAverageResponseTime(logs: any[]): number {
        const responseTimes = logs
            .map(log => log.details?.responseTime)
            .filter(time => time && typeof time === 'number');

        if (responseTimes.length === 0) return 0;

        return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    private groupRequestsByMethod(logs: any[]): Record<string, number> {
        return logs.reduce((acc, log) => {
            const method = log.details?.method || 'UNKNOWN';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});
    }

    private groupRequestsByEndpoint(logs: any[]): Record<string, number> {
        return logs.reduce((acc, log) => {
            const endpoint = log.details?.endpoint || 'UNKNOWN';
            acc[endpoint] = (acc[endpoint] || 0) + 1;
            return acc;
        }, {});
    }

    private extractErrors(logs: any[]): any[] {
        return logs
            .filter(log => log.status === 'ERROR')
            .map(log => ({
                timestamp: log.createdAt,
                error: log.details?.error,
                method: log.details?.method,
                endpoint: log.details?.endpoint,
            }));
    }
}
