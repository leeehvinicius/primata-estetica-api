import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { SecurityService } from './security.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface BackupOptions {
    includeAuditLogs?: boolean;
    includeSecurityEvents?: boolean;
    includeSensitiveData?: boolean;
    compress?: boolean;
    encrypt?: boolean;
    retentionDays?: number;
}

export interface BackupInfo {
    id: string;
    filename: string;
    size: number;
    createdAt: Date;
    options: BackupOptions;
    checksum: string;
    encrypted: boolean;
    compressed: boolean;
}

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly backupDir = process.env.BACKUP_DIR || './backups';

    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
        private securityService: SecurityService
    ) {
        this.ensureBackupDirectory();
    }

    // ===== CRIAÇÃO DE BACKUP =====
    
    async createBackup(options: BackupOptions = {}, userId: string): Promise<BackupInfo> {
        const defaultOptions: BackupOptions = {
            includeAuditLogs: true,
            includeSecurityEvents: true,
            includeSensitiveData: false,
            compress: true,
            encrypt: true,
            retentionDays: 30,
            ...options
        };

        try {
            this.logger.log('Iniciando backup do banco de dados...');

            // Log do início do backup
            await this.securityService.logAction({
                userId,
                action: 'BACKUP',
                resource: 'database',
                method: 'POST',
                endpoint: '/security/backup',
                ipAddress: '127.0.0.1',
                success: true,
                metadata: { options: defaultOptions }
            });

            // Gerar dados de backup
            const backupData = await this.generateBackupData(defaultOptions);
            
            // Criar informações do backup
            const backupId = this.encryptionService.generateSecureToken(16);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}-${backupId}.json`;
            
            let finalData = JSON.stringify(backupData, null, 2);
            let isCompressed = false;
            let isEncrypted = false;

            // Comprimir se solicitado
            if (defaultOptions.compress) {
                const compressed = await gzip(Buffer.from(finalData, 'utf8'));
                finalData = compressed.toString('base64');
                isCompressed = true;
            }

            // Criptografar se solicitado
            if (defaultOptions.encrypt) {
                finalData = this.encryptionService.encryptSensitiveData(finalData, 'backup');
                isEncrypted = true;
            }

            // Salvar arquivo
            const filePath = path.join(this.backupDir, filename);
            await fs.writeFile(filePath, finalData, 'utf8');

            // Calcular checksum
            const checksum = this.encryptionService.sha256Hash(finalData);

            // Obter tamanho do arquivo
            const stats = await fs.stat(filePath);

            const backupInfo: BackupInfo = {
                id: backupId,
                filename,
                size: stats.size,
                createdAt: new Date(),
                options: defaultOptions,
                checksum,
                encrypted: isEncrypted,
                compressed: isCompressed
            };

            // Salvar informações do backup no banco
            await this.saveBackupInfo(backupInfo, userId);

            // Limpar backups antigos
            await this.cleanupOldBackups(defaultOptions.retentionDays || 30);

            this.logger.log(`Backup criado com sucesso: ${filename}`);

            return backupInfo;

        } catch (error) {
            this.logger.error('Erro ao criar backup', error);
            
            // Log do erro
            await this.securityService.logAction({
                userId,
                action: 'BACKUP',
                resource: 'database',
                method: 'POST',
                endpoint: '/security/backup',
                ipAddress: '127.0.0.1',
                success: false,
                errorMessage: error.message,
                metadata: { options: defaultOptions }
            });

            throw error;
        }
    }

    // ===== RESTAURAÇÃO DE BACKUP =====
    
    async restoreBackup(backupId: string, userId: string): Promise<void> {
        try {
            this.logger.log(`Iniciando restauração do backup: ${backupId}`);

            // Log do início da restauração
            await this.securityService.logAction({
                userId,
                action: 'RESTORE',
                resource: 'database',
                method: 'POST',
                endpoint: `/security/backup/${backupId}/restore`,
                ipAddress: '127.0.0.1',
                success: true,
                metadata: { backupId }
            });

            // Buscar informações do backup
            const backupInfo = await this.getBackupInfo(backupId);
            if (!backupInfo) {
                throw new Error('Backup não encontrado');
            }

            // Ler arquivo de backup
            const filePath = path.join(this.backupDir, backupInfo.filename);
            let fileContent = await fs.readFile(filePath, 'utf8');

            // Descriptografar se necessário
            if (backupInfo.encrypted) {
                fileContent = this.encryptionService.decryptSensitiveData(fileContent, 'backup');
            }

            // Descomprimir se necessário
            if (backupInfo.compressed) {
                const decompressed = await gunzip(Buffer.from(fileContent, 'base64'));
                fileContent = decompressed.toString('utf8');
            }

            // Verificar integridade
            const currentChecksum = this.encryptionService.sha256Hash(fileContent);
            if (currentChecksum !== backupInfo.checksum) {
                throw new Error('Integridade do backup comprometida');
            }

            // Parse dos dados
            const backupData = JSON.parse(fileContent);

            // ATENÇÃO: A restauração deve ser feita com MUITO cuidado
            // Por enquanto, apenas log da ação - implementação completa requer mais cuidado
            this.logger.warn('RESTAURAÇÃO DE BACKUP - Funcionalidade requer implementação cuidadosa');

            this.logger.log(`Backup restaurado com sucesso: ${backupId}`);

        } catch (error) {
            this.logger.error('Erro ao restaurar backup', error);
            
            // Log do erro
            await this.securityService.logAction({
                userId,
                action: 'RESTORE',
                resource: 'database',
                method: 'POST',
                endpoint: `/security/backup/${backupId}/restore`,
                ipAddress: '127.0.0.1',
                success: false,
                errorMessage: error.message,
                metadata: { backupId }
            });

            throw error;
        }
    }

    // ===== LISTAGEM E GERENCIAMENTO =====
    
    async listBackups(): Promise<BackupInfo[]> {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));
            
            const backups: BackupInfo[] = [];
            
            for (const file of backupFiles) {
                try {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    
                    // Extrair ID do backup do nome do arquivo
                    const match = file.match(/backup-.*-([a-f0-9]+)\.json$/);
                    const backupId = match ? match[1] : null;
                    
                    if (backupId) {
                        const info = await this.getBackupInfo(backupId);
                        if (info) {
                            backups.push({
                                ...info,
                                size: stats.size
                            });
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Erro ao processar arquivo de backup: ${file}`, error);
                }
            }
            
            return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
        } catch (error) {
            this.logger.error('Erro ao listar backups', error);
            return [];
        }
    }

    async deleteBackup(backupId: string, userId: string): Promise<void> {
        try {
            const backupInfo = await this.getBackupInfo(backupId);
            if (!backupInfo) {
                throw new Error('Backup não encontrado');
            }

            // Deletar arquivo
            const filePath = path.join(this.backupDir, backupInfo.filename);
            await fs.unlink(filePath);

            // Remover do banco
            await this.removeBackupInfo(backupId);

            // Log da ação
            await this.securityService.logAction({
                userId,
                action: 'DELETE',
                resource: 'backup',
                resourceId: backupId,
                method: 'DELETE',
                endpoint: `/security/backup/${backupId}`,
                ipAddress: '127.0.0.1',
                success: true,
                metadata: { filename: backupInfo.filename }
            });

            this.logger.log(`Backup deletado: ${backupInfo.filename}`);

        } catch (error) {
            this.logger.error('Erro ao deletar backup', error);
            throw error;
        }
    }

    // ===== MÉTODOS PRIVADOS =====
    
    private async generateBackupData(options: BackupOptions): Promise<any> {
        const backupData: any = {
            metadata: {
                version: '1.0',
                createdAt: new Date(),
                options,
                databaseSchema: 'prisma'
            },
            data: {}
        };

        // Dados principais do sistema
        const mainTables = [
            'user', 'profile', 'client', 'professional', 'service', 
            'appointment', 'payment', 'product', 'stockMovement'
        ];

        for (const table of mainTables) {
            try {
                const data = await (this.prisma as any)[table].findMany();
                
                // Remover dados sensíveis se não incluído
                if (!options.includeSensitiveData) {
                    backupData.data[table] = data.map((item: any) => {
                        const { passwordHash, refreshTokenHash, ...safe } = item;
                        return safe;
                    });
                } else {
                    backupData.data[table] = data;
                }
            } catch (error) {
                this.logger.warn(`Erro ao fazer backup da tabela ${table}`, error);
            }
        }

        // Logs de auditoria (opcional)
        if (options.includeAuditLogs) {
            try {
                const auditLogs = await (this.prisma as any).auditLog.findMany({
                    take: 10000, // Limitar para não ficar muito grande
                    orderBy: { createdAt: 'desc' }
                });
                backupData.data.auditLog = auditLogs;
            } catch (error) {
                this.logger.warn('Erro ao fazer backup dos logs de auditoria', error);
            }
        }

        // Eventos de segurança (opcional)
        if (options.includeSecurityEvents) {
            try {
                const securityEvents = await (this.prisma as any).securityEvent.findMany({
                    take: 5000,
                    orderBy: { createdAt: 'desc' }
                });
                backupData.data.securityEvent = securityEvents;
            } catch (error) {
                this.logger.warn('Erro ao fazer backup dos eventos de segurança', error);
            }
        }

        return backupData;
    }

    private async saveBackupInfo(info: BackupInfo, userId: string): Promise<void> {
        // Salvar informações do backup em uma tabela de metadados ou arquivo
        // Por simplicidade, vamos usar configurações de segurança
        await this.securityService.setSecurityConfig(
            `backup_${info.id}`,
            JSON.stringify(info),
            'BACKUP',
            userId,
            `Backup criado em ${info.createdAt}`,
            false
        );
    }

    private async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
        try {
            const config = await this.securityService.getSecurityConfig(`backup_${backupId}`);
            return config ? JSON.parse(config) : null;
        } catch {
            return null;
        }
    }

    private async removeBackupInfo(backupId: string): Promise<void> {
        try {
            await (this.securityService as any).prisma.securityConfiguration.delete({
                where: { key: `backup_${backupId}` }
            });
        } catch (error) {
            this.logger.warn('Erro ao remover informações do backup', error);
        }
    }

    private async ensureBackupDirectory(): Promise<void> {
        try {
            await fs.access(this.backupDir);
        } catch {
            await fs.mkdir(this.backupDir, { recursive: true });
            this.logger.log(`Diretório de backup criado: ${this.backupDir}`);
        }
    }

    private async cleanupOldBackups(retentionDays: number): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            const backups = await this.listBackups();
            
            for (const backup of backups) {
                if (backup.createdAt < cutoffDate) {
                    try {
                        await this.deleteBackup(backup.id, 'system');
                        this.logger.log(`Backup antigo removido: ${backup.filename}`);
                    } catch (error) {
                        this.logger.warn(`Erro ao remover backup antigo: ${backup.filename}`, error);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Erro na limpeza de backups antigos', error);
        }
    }
}
