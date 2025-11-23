import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Nome do serviço' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição do serviço', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID da categoria do serviço' })
  @IsString()
  serviceCategoryId: string;

  @ApiProperty({ description: 'Duração em minutos' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ description: 'Preço base do serviço' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ description: 'Preço atual do serviço' })
  @IsNumber()
  @Min(0)
  currentPrice: number;

  @ApiProperty({
    description: 'Se o serviço requer profissional',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresProfessional?: boolean;

  @ApiProperty({
    description: 'Máximo de clientes simultâneos',
    required: false,
    default: 1,
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

  @ApiProperty({
    description: 'Status ativo do serviço',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
