import { IsOptional, IsEnum, IsString, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductUnit } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class ListProductsDto {
    @ApiProperty({ description: 'Página atual', required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Itens por página', required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiProperty({ description: 'Buscar por nome do produto', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Buscar por SKU', required: false })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiProperty({ description: 'Buscar por código de barras', required: false })
    @IsOptional()
    @IsString()
    barcode?: string;

    @ApiProperty({ description: 'Filtrar por categoria', required: false })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiProperty({ description: 'Filtrar por fornecedor', required: false })
    @IsOptional()
    @IsString()
    supplierId?: string;

    @ApiProperty({ description: 'Filtrar por unidade', enum: ProductUnit, required: false })
    @IsOptional()
    @IsEnum(ProductUnit)
    unit?: ProductUnit;

    @ApiProperty({ description: 'Filtrar por status ativo', required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Filtrar por produtos com estoque baixo', required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    lowStock?: boolean;

    @ApiProperty({ description: 'Filtrar por produtos vencendo em breve', required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    expiringSoon?: boolean;

    @ApiProperty({ description: 'Filtrar por produtos que requerem prescrição', required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    requiresPrescription?: boolean;

    @ApiProperty({ description: 'Valor mínimo de preço', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiProperty({ description: 'Valor máximo de preço', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiProperty({ description: 'Ordenar por campo', required: false, default: 'name' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'name';

    @ApiProperty({ description: 'Direção da ordenação', required: false, default: 'asc' })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'asc';
}
