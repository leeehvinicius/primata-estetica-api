import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EncryptionService {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyDerivationIterations = 100000;

    constructor() {
        // Verificar se a chave mestra está definida
        if (!process.env.MASTER_ENCRYPTION_KEY) {
            this.logger.warn('MASTER_ENCRYPTION_KEY not defined. Using default key for development only!');
        }
    }

    // ===== CRIPTOGRAFIA SIMÉTRICA =====
    
    /**
     * Criptografa dados sensíveis usando AES-256-GCM
     */
    encryptSensitiveData(plaintext: string, context?: string): string {
        try {
            const key = this.deriveKey(context);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = (cipher as any).getAuthTag();
            
            // Combinar IV, tag de autenticação e dados criptografados
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        } catch (error) {
            this.logger.error('Encryption failed', error);
            throw new Error('Falha na criptografia dos dados');
        }
    }

    /**
     * Descriptografa dados sensíveis
     */
    decryptSensitiveData(encryptedData: string, context?: string): string {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Formato de dados criptografados inválido');
            }

            const [ivHex, authTagHex, encrypted] = parts;
            const key = this.deriveKey(context);
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            (decipher as any).setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            this.logger.error('Decryption failed', error);
            throw new Error('Falha na descriptografia dos dados');
        }
    }

    // ===== HASH DE SENHAS =====
    
    /**
     * Hash seguro de senha com salt
     */
    async hashPassword(password: string): Promise<string> {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }

    /**
     * Verificar senha contra hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Gerar senha segura aleatória
     */
    generateSecurePassword(length = 16): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        
        return password;
    }

    // ===== TOKENS E CHAVES =====
    
    /**
     * Gerar token seguro
     */
    generateSecureToken(length = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Gerar par de chaves RSA
     */
    generateKeyPair(): { publicKey: string; privateKey: string } {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });

        return { publicKey, privateKey };
    }

    // ===== CRIPTOGRAFIA ASSIMÉTRICA =====
    
    /**
     * Criptografar com chave pública RSA
     */
    encryptWithPublicKey(data: string, publicKey: string): string {
        const buffer = Buffer.from(data, 'utf8');
        const encrypted = crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        }, buffer);
        
        return encrypted.toString('base64');
    }

    /**
     * Descriptografar com chave privada RSA
     */
    decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
        const buffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt({
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        }, buffer);
        
        return decrypted.toString('utf8');
    }

    // ===== ASSINATURA DIGITAL =====
    
    /**
     * Assinar dados com chave privada
     */
    signData(data: string, privateKey: string): string {
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        sign.end();
        
        return sign.sign(privateKey, 'base64');
    }

    /**
     * Verificar assinatura digital
     */
    verifySignature(data: string, signature: string, publicKey: string): boolean {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        verify.end();
        
        return verify.verify(publicKey, signature, 'base64');
    }

    // ===== HASH E VERIFICAÇÃO =====
    
    /**
     * Hash SHA-256
     */
    sha256Hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Hash HMAC-SHA256 com chave
     */
    hmacSha256(data: string, key: string): string {
        return crypto.createHmac('sha256', key).update(data).digest('hex');
    }

    /**
     * Verificar integridade com HMAC
     */
    verifyHmac(data: string, hmac: string, key: string): boolean {
        const calculatedHmac = this.hmacSha256(data, key);
        return crypto.timingSafeEqual(
            Buffer.from(hmac, 'hex'),
            Buffer.from(calculatedHmac, 'hex')
        );
    }

    // ===== MÉTODOS AUXILIARES =====
    
    /**
     * Derivar chave a partir da chave mestra
     */
    private deriveKey(context?: string): Buffer {
        const masterKey = process.env.MASTER_ENCRYPTION_KEY || 'default-development-key-not-secure';
        const salt = context ? `${masterKey}-${context}` : masterKey;
        
        return crypto.pbkdf2Sync(masterKey, salt, this.keyDerivationIterations, 32, 'sha256');
    }

    /**
     * Gerar salt aleatório
     */
    generateSalt(length = 16): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Limpar dados sensíveis da memória
     */
    clearSensitiveData(data: any): void {
        if (typeof data === 'string') {
            // Sobrescrever string com zeros
            for (let i = 0; i < data.length; i++) {
                (data as any)[i] = '\0';
            }
        } else if (Buffer.isBuffer(data)) {
            data.fill(0);
        } else if (Array.isArray(data)) {
            data.fill(null);
        }
    }

    // ===== VALIDAÇÃO DE POLÍTICAS DE SENHA =====
    
    /**
     * Validar se a senha atende aos critérios de segurança
     */
    validatePasswordPolicy(password: string): {
        isValid: boolean;
        errors: string[];
        strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    } {
        const errors: string[] = [];
        let score = 0;

        // Comprimento mínimo
        if (password.length < 8) {
            errors.push('Senha deve ter pelo menos 8 caracteres');
        } else if (password.length >= 12) {
            score += 2;
        } else {
            score += 1;
        }

        // Letras maiúsculas
        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra maiúscula');
        } else {
            score += 1;
        }

        // Letras minúsculas
        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra minúscula');
        } else {
            score += 1;
        }

        // Números
        if (!/\d/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        } else {
            score += 1;
        }

        // Caracteres especiais
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Senha deve conter pelo menos um caractere especial');
        } else {
            score += 2;
        }

        // Sequências comuns
        const commonSequences = ['123', 'abc', 'qwe', 'password', '123456'];
        const lowerPassword = password.toLowerCase();
        for (const seq of commonSequences) {
            if (lowerPassword.includes(seq)) {
                errors.push('Senha não deve conter sequências comuns');
                score -= 1;
                break;
            }
        }

        // Determinar força
        let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
        if (score < 3) {
            strength = 'weak';
        } else if (score < 5) {
            strength = 'medium';
        } else if (score < 7) {
            strength = 'strong';
        } else {
            strength = 'very-strong';
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }
}
