import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PhotoCaptureService {
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads/photos');
    this.ensureUploadDirectory();
  }

  /**
   * Processa e salva uma foto capturada
   * @param photoData Dados da foto em base64
   * @param userId ID do usuário
   * @returns URL da foto salva
   */
  async processPhoto(photoData: string, userId: string): Promise<string> {
    try {
      // Validar formato da foto
      if (!this.isValidBase64Image(photoData)) {
        throw new BadRequestException('Formato de foto inválido');
      }

      // Extrair metadados da foto
      const { mimeType, data } = this.extractBase64Data(photoData);

      // Validar tipo de arquivo
      if (!this.isAllowedImageType(mimeType)) {
        throw new BadRequestException('Tipo de arquivo não permitido');
      }

      // Gerar nome único para o arquivo
      const fileName = this.generateFileName(userId, mimeType);
      const filePath = path.join(this.uploadPath, fileName);

      // Salvar arquivo
      await fs.promises.writeFile(filePath, data);

      // Retornar URL da foto
      return this.getPhotoUrl(fileName);
    } catch (error) {
      throw new BadRequestException(`Erro ao processar foto: ${error.message}`);
    }
  }

  /**
   * Valida se uma string é uma imagem base64 válida
   * @param data String base64
   * @returns true se for válida
   */
  private isValidBase64Image(data: string): boolean {
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    return base64Regex.test(data);
  }

  /**
   * Extrai dados e tipo MIME de uma string base64
   * @param data String base64
   * @returns Objeto com tipo MIME e dados
   */
  private extractBase64Data(data: string): { mimeType: string; data: Buffer } {
    const matches = data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new BadRequestException('Formato base64 inválido');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return { mimeType, data: buffer };
  }

  /**
   * Verifica se o tipo de imagem é permitido
   * @param mimeType Tipo MIME da imagem
   * @returns true se for permitido
   */
  private isAllowedImageType(mimeType: string): boolean {
    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    return allowedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Gera um nome único para o arquivo
   * @param userId ID do usuário
   * @param mimeType Tipo MIME da imagem
   * @returns Nome do arquivo
   */
  private generateFileName(userId: string, mimeType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}_${timestamp}_${random}.${mimeType}`;
  }

  /**
   * Retorna a URL da foto
   * @param fileName Nome do arquivo
   * @returns URL da foto
   */
  private getPhotoUrl(fileName: string): string {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/photos/${fileName}`;
  }

  /**
   * Cria o diretório de upload se não existir
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Remove uma foto do sistema de arquivos
   * @param photoUrl URL da foto
   */
  async deletePhoto(photoUrl: string): Promise<void> {
    try {
      const fileName = path.basename(photoUrl);
      const filePath = path.join(this.uploadPath, fileName);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
    }
  }

  /**
   * Valida o tamanho da foto
   * @param photoData Dados da foto em base64
   * @param maxSizeMB Tamanho máximo em MB
   * @returns true se o tamanho for válido
   */
  validatePhotoSize(photoData: string, maxSizeMB: number = 5): boolean {
    const { data } = this.extractBase64Data(photoData);
    const sizeInMB = data.length / (1024 * 1024);
    return sizeInMB <= maxSizeMB;
  }

  /**
   * Redimensiona uma foto (implementação básica)
   * @param photoData Dados da foto em base64
   * @param maxWidth Largura máxima
   * @param maxHeight Altura máxima
   * @returns Foto redimensionada em base64
   */
  async resizePhoto(
    photoData: string,
    maxWidth: number = 800,
    maxHeight: number = 600,
  ): Promise<string> {
    // Implementação básica - em produção, usar uma biblioteca como sharp
    // Por enquanto, retorna a foto original
    return photoData;
  }
}
