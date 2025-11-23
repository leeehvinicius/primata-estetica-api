import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreatePartnerDto {
  @ApiProperty({ description: 'Nome do Parceiro' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tipo de Documento', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Documento (CPF/CNPJ)' })
  @IsString()
  document: string;

  @ApiProperty({ description: 'Desconto para o Parceiro (%)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerDiscount?: number;

  @ApiProperty({ description: 'Desconto para o Cliente (%)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  clientDiscount?: number;

  @ApiProperty({ description: 'Desconto (valor fixo)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedDiscount?: number;

  @ApiProperty({ description: 'Observações', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Parceiro ativo', default: true })
  @IsOptional()
  isActive?: boolean;
}
