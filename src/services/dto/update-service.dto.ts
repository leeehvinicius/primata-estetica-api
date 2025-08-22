import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';

export class UpdateServiceDto {
    @ApiProperty({ description: 'Nome do serviço', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Descrição do serviço', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Categoria do serviço', enum: ServiceCategory, required: false })
    @IsOptional()
    @IsEnum(ServiceCategory)
    category?: ServiceCategory;

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

    @ApiProperty({ description: 'Se o serviço requer profissional', required: false })
    @IsOptional()
    @IsBoolean()
    requiresProfessional?: boolean;

    @ApiProperty({ description: 'Máximo de clientes simultâneos', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxConcurrentClients?: number;

    @ApiProperty({ description: 'Tempo de preparação em minutos', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    preparationTime?: number;

    @ApiProperty({ description: 'Tempo de recuperação em minutos', required: false })
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
}
