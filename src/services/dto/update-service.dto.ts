import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiProperty({ description: 'Nome do serviço', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Descrição do serviço', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'ID da categoria do serviço (opcional se category ou categoryId for fornecido)',
    required: false 
  })
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @ApiProperty({ 
    description: 'ID da categoria do serviço (alias para serviceCategoryId)',
    required: false 
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ 
    description: 'Nome da categoria do serviço ou ID (opcional se serviceCategoryId/categoryId for fornecido). Ex: FACIAL_TREATMENT',
    required: false 
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Duração em minutos', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ description: 'Preço base do serviço', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ description: 'Preço atual do serviço', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @ApiProperty({
    description: 'Se o serviço requer profissional',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresProfessional?: boolean;

  @ApiProperty({
    description: 'Máximo de clientes simultâneos',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxConcurrentClients?: number;

  @ApiProperty({
    description: 'Tempo de preparação em minutos',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;

  @ApiProperty({
    description: 'Tempo de recuperação em minutos',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recoveryTime?: number;

  @ApiProperty({ description: 'Contraindicações', required: false })
  @IsOptional()
  @IsString()
  contraindications?: string;

  @ApiProperty({ description: 'Benefícios do serviço', required: false })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiProperty({ description: 'Observações gerais', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Status ativo do serviço', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Cor do serviço (hex, ex: #FF5733)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message: 'color deve ser um hex válido, ex: #AABBCC',
  })
  color?: string;
}
