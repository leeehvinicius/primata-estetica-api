import { IsString, IsOptional, IsEnum, IsNumber, Min, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductUnit } from '@prisma/client';

export class CreateProductDto {
    @ApiProperty({ description: 'Nome do produto' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Descrição do produto', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'ID da categoria do produto' })
    @IsUUID()
    categoryId: string;

    @ApiProperty({ description: 'ID do fornecedor', required: false })
    @IsOptional()
    @IsUUID()
    supplierId?: string;

    @ApiProperty({ description: 'Código SKU do produto', required: false })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiProperty({ description: 'Código de barras', required: false })
    @IsOptional()
    @IsString()
    barcode?: string;

    @ApiProperty({ description: 'Unidade do produto', enum: ProductUnit })
    @IsEnum(ProductUnit)
    unit: ProductUnit;

    @ApiProperty({ description: 'Estoque mínimo', required: false, default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minStock?: number;

    @ApiProperty({ description: 'Estoque máximo', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxStock?: number;

    @ApiProperty({ description: 'Preço de custo' })
    @IsNumber()
    @Min(0)
    costPrice: number;

    @ApiProperty({ description: 'Preço de venda' })
    @IsNumber()
    @Min(0)
    salePrice: number;

    @ApiProperty({ description: 'Requer prescrição', required: false, default: false })
    @IsOptional()
    @IsBoolean()
    requiresPrescription?: boolean;

    @ApiProperty({ description: 'Data de validade (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsDateString()
    expirationDate?: string;

    @ApiProperty({ description: 'Localização no estoque', required: false })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ description: 'Observações do produto', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
