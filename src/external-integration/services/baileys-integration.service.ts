import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import * as fs from 'fs';
import * as path from 'path';
import { toDataURL } from 'qrcode';

@Injectable()
export class BaileysIntegrationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysIntegrationService.name);
  private socket: WASocket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly authFolder: string;
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private connectionStatusListeners: Array<(status: string) => void> = [];

  constructor(private readonly configService: ConfigService) {
    // Pasta para armazenar a autenticação do WhatsApp
    this.authFolder = path.join(process.cwd(), '.wabauth');
    
    // Criar pasta se não existir
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true });
    }
  }

  async onModuleInit() {
    // Tentar conectar automaticamente se houver credenciais salvas
    try {
      const credsPath = path.join(this.authFolder, 'creds.json');
      if (fs.existsSync(credsPath)) {
        this.logger.log('Credenciais encontradas. Tentando conectar automaticamente ao WhatsApp...');
        // Aguardar um pouco para garantir que o módulo foi totalmente inicializado
        setTimeout(() => {
          this.connect().catch(error => {
            this.logger.warn(`Falha na conexão automática do WhatsApp: ${error.message}`);
          });
        }, 2000);
      } else {
        this.logger.log('Nenhuma credencial encontrada. Conecte manualmente usando o endpoint /whatsapp/connect');
      }
    } catch (error) {
      this.logger.error('Erro ao verificar credenciais do WhatsApp', error);
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Conectar ao WhatsApp usando Baileys
   * @returns QR Code em base64 se necessário, ou null se já conectado
   */
  async connect(): Promise<{ qrCode?: string; status: string; message: string }> {
    if (this.socket && this.socket.user) {
      return {
        status: 'connected',
        message: 'Já conectado ao WhatsApp',
      };
    }

    if (this.isConnecting) {
      // Se já está conectando, retornar QR Code se disponível
      if (this.qrCode) {
        return {
          status: 'qr_code_ready',
          message: 'Conexão em andamento. Escaneie o QR Code.',
          qrCode: this.qrCode,
        };
      }
      return {
        status: 'connecting',
        message: 'Conexão já em andamento. Aguarde ou desconecte primeiro.',
      };
    }

    try {
      this.isConnecting = true;
      this.connectionStatus = 'connecting';
      this.notifyStatusChange('connecting');
      this.logger.log('Iniciando conexão com WhatsApp via Baileys...');

      // Obter versão mais recente do Baileys
      const { version } = await fetchLatestBaileysVersion();
      this.logger.log(`Usando Baileys versão ${version.join('.')}`);

      // Configurar autenticação
      const { state, saveCreds } = await useMultiFileAuthState(
        this.authFolder,
      );

      // Verificar se já tem credenciais salvas
      const hasCredentials = state.creds.registered;

      // Criar socket do WhatsApp
      this.socket = makeWASocket({
        version,
        logger: P({ level: 'silent' }), // Silenciar logs do Baileys
        printQRInTerminal: false, // Não mostrar QR Code no terminal (vamos retornar via API)
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
        },
        getMessage: async (key) => {
          return {
            conversation: 'Mensagem não encontrada',
          };
        },
      });

      // Evento de atualização de credenciais
      this.socket.ev.on('creds.update', saveCreds);

      // Aguardar QR Code ou conexão (timeout de 20 segundos)
      const qrCodePromise = new Promise<string | null>((resolve) => {
        const timeout = setTimeout(() => {
          this.logger.warn('Timeout aguardando QR Code ou conexão');
          resolve(null);
        }, 20000); // 20 segundos para gerar QR Code ou conectar

        const handler = async (update: any) => {
          // Se gerou QR Code
          if (update.qr) {
            clearTimeout(timeout);
            if (this.socket) {
              this.socket.ev.off('connection.update', handler);
            }
            try {
              const qrCode = await toDataURL(update.qr);
              this.logger.log(`QR Code gerado (${qrCode.substring(0, 50)}...)`);
              this.qrCode = qrCode;
              this.notifyStatusChange('qr_code_ready');
              resolve(qrCode);
            } catch (error) {
              this.logger.error('Erro ao gerar QR Code', error);
              resolve(null);
            }
          }
          // Se conectou com sucesso (sem precisar de QR Code)
          else if (update.connection === 'open') {
            clearTimeout(timeout);
            if (this.socket) {
              this.socket.ev.off('connection.update', handler);
            }
            this.logger.log('Conectado automaticamente sem QR Code');
            resolve(null);
          }
        };

        if (this.socket) {
          this.socket.ev.on('connection.update', handler);
        } else {
          clearTimeout(timeout);
          resolve(null);
        }
      });

      // Evento de mudança de conexão (permanente, para reconexões)
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Atualizar QR Code se receber um novo
        if (qr) {
          this.logger.log('Novo QR Code recebido no evento de conexão');
          try {
            this.qrCode = await toDataURL(qr);
            this.logger.log(`QR Code atualizado (${this.qrCode.substring(0, 50)}...)`);
            this.notifyStatusChange('qr_code_ready');
          } catch (error) {
            this.logger.error('Erro ao gerar QR Code no evento', error);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          this.logger.log(
            `Conexão fechada. Status: ${statusCode}, Reconectando: ${shouldReconnect}, LoggedOut: ${isLoggedOut}`,
          );

          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.notifyStatusChange('disconnected');

          // Se foi deslogado, limpar credenciais e tentar nova conexão com QR Code
          if (isLoggedOut) {
            this.logger.warn('Sessão deslogada. Limpando credenciais...');
            this.isConnecting = false;
            this.socket = null;
            this.reconnectAttempts = 0;
            
            // Limpar credenciais em background
            setTimeout(async () => {
              try {
                if (fs.existsSync(this.authFolder)) {
                  fs.rmSync(this.authFolder, { recursive: true, force: true });
                  fs.mkdirSync(this.authFolder, { recursive: true });
                  this.logger.log('Credenciais limpas. Tentando nova conexão...');
                  await this.connect();
                }
              } catch (error) {
                this.logger.error('Erro ao limpar credenciais', error);
              }
            }, 1000);
          }
          // Se deve reconectar (erro temporário)
          else if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.isConnecting = false;
            this.socket = null;
            this.logger.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), 3000);
          }
          // Desistiu de reconectar
          else {
            this.logger.error('Não foi possível reconectar ao WhatsApp. Limite de tentativas atingido.');
            this.isConnecting = false;
            this.socket = null;
            this.connectionStatus = 'disconnected';
            this.reconnectAttempts = 0;
            this.notifyStatusChange('disconnected');
          }
        } else if (connection === 'open') {
          this.logger.log('✅ Conectado ao WhatsApp com sucesso!');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.connectionStatus = 'connected';
          this.qrCode = null;
          this.notifyStatusChange('connected');
        }
      });

      // Aguardar QR Code ou conexão automática
      const qrCode = await qrCodePromise;
      
      if (qrCode) {
        // QR Code foi gerado
        return {
          qrCode: qrCode,
          status: 'qr_code_ready',
          message: 'Escaneie o QR Code com o WhatsApp',
        };
      } else if (this.socket && this.socket.user) {
        // Conectou automaticamente
        return {
          status: 'connected',
          message: 'Conectado ao WhatsApp com sucesso',
        };
      } else {
        // Aguardando conexão
        return {
          status: 'connecting',
          message: hasCredentials 
            ? 'Conectando ao WhatsApp com credenciais salvas...' 
            : 'Aguardando geração do QR Code...',
        };
      }
    } catch (error: any) {
      this.logger.error(`Erro ao conectar ao WhatsApp: ${error.message}`, error.stack);
      this.isConnecting = false;
      this.socket = null;
      this.connectionStatus = 'disconnected';
      this.notifyStatusChange('disconnected');
      throw error;
    }
  }

  /**
   * Desconectar do WhatsApp
   */
  async disconnect(): Promise<void> {
    this.logger.log('Desconectando do WhatsApp...');
    this.isConnecting = false;
    
    if (this.socket) {
      try {
        await this.socket.end(undefined);
      } catch (error) {
        this.logger.warn('Erro ao finalizar socket:', error);
      }
      this.socket = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.qrCode = null;
    this.reconnectAttempts = 0;
    this.notifyStatusChange('disconnected');
  }

  /**
   * Limpar autenticação (forçar novo QR Code)
   */
  async clearAuth(): Promise<void> {
    this.logger.log('Limpando autenticação do WhatsApp...');
    await this.disconnect();
    
    // Deletar pasta de autenticação
    if (fs.existsSync(this.authFolder)) {
      fs.rmSync(this.authFolder, { recursive: true, force: true });
      fs.mkdirSync(this.authFolder, { recursive: true });
    }
    
    this.connectionStatus = 'disconnected';
    this.qrCode = null;
    this.notifyStatusChange('disconnected');
  }

  /**
   * Enviar mensagem via WhatsApp usando Baileys
   * @param phoneNumber Número do telefone (formato: 5511999999999)
   * @param message Mensagem a ser enviada
   * @returns Resultado do envio
   */
  async sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Verificar se está conectado
      if (!this.socket || !this.socket.user) {
        this.logger.warn('Não conectado ao WhatsApp');
        return {
          success: false,
          error: 'Não conectado ao WhatsApp. Conecte primeiro usando o endpoint /whatsapp/connect',
        };
      }

      // Formatar número de telefone
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (!formattedPhone) {
        throw new Error('Número de telefone inválido');
      }

      // Formatar para JID do WhatsApp (número@s.whatsapp.net)
      const jid = `${formattedPhone}@s.whatsapp.net`;

      this.logger.log(`Enviando mensagem WhatsApp para ${formattedPhone} via Baileys`);

      // Enviar mensagem
      const result = await this.socket.sendMessage(jid, {
        text: message,
      });

      if (result?.key?.id) {
        this.logger.log(
          `Mensagem enviada com sucesso para ${formattedPhone}. MessageId: ${result.key.id}`,
        );
        return {
          success: true,
          messageId: result.key.id,
        };
      } else {
        throw new Error('Resposta inválida do WhatsApp');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao enviar mensagem via WhatsApp';
      this.logger.error(
        `Erro ao enviar mensagem WhatsApp para ${phoneNumber}: ${errorMessage}`,
        error.stack,
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verificar status da conexão com WhatsApp
   */
  async checkStatus(): Promise<{ connected: boolean; status: string; message?: string; qrCode?: string }> {
    try {
      if (!this.socket) {
        return {
          connected: false,
          status: 'disconnected',
          message: 'Socket não inicializado',
        };
      }

      if (!this.socket.user) {
        if (this.qrCode) {
          return {
            connected: false,
            status: 'qr_code_ready',
            message: 'QR Code disponível. Escaneie com o WhatsApp.',
            qrCode: this.qrCode,
          };
        }
        return {
          connected: false,
          status: this.connectionStatus,
          message: 'Não conectado ao WhatsApp. Conecte usando o endpoint /whatsapp/connect',
        };
      }

      return {
        connected: true,
        status: 'connected',
        message: `Conectado como ${this.socket.user.name || this.socket.user.id}`,
      };
    } catch (error: any) {
      this.logger.error('Erro ao verificar status do WhatsApp', error);
      return {
        connected: false,
        status: 'error',
        message: error.message || 'Erro ao verificar conexão',
      };
    }
  }

  /**
   * Obter QR Code atual (se disponível)
   */
  getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Adicionar listener para mudanças de status
   */
  onStatusChange(callback: (status: string) => void): void {
    this.connectionStatusListeners.push(callback);
  }

  /**
   * Notificar mudanças de status
   */
  private notifyStatusChange(status: string): void {
    this.connectionStatusListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        this.logger.error('Erro ao notificar mudança de status', error);
      }
    });
  }

  /**
   * Formatar número de telefone para o formato internacional
   * Remove caracteres especiais e adiciona código do país se necessário
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remover todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Se o número não começar com código do país (55 para Brasil), adicionar
    if (!cleaned.startsWith('55') && cleaned.length === 10) {
      // Número brasileiro sem código do país
      cleaned = '55' + cleaned;
    } else if (!cleaned.startsWith('55') && cleaned.length === 11) {
      // Número brasileiro com DDD (11 dígitos)
      cleaned = '55' + cleaned;
    }

    // Validar se o número tem pelo menos 10 dígitos
    if (cleaned.length < 10) {
      return null;
    }

    return cleaned;
  }
}
