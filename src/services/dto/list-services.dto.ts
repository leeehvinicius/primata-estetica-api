import { IsOptional, IsEnum, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class ListServicesDto {
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

    @ApiProperty({ description: 'Buscar por nome ou descrição', required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ description: 'Filtrar por categoria', enum: ServiceCategory, required: false })
    @IsOptional()
    @IsEnum(ServiceCategory)
    category?: ServiceCategory;

    @ApiProperty({ description: 'Filtrar por status ativo', required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Filtrar por preço mínimo', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiProperty({ description: 'Filtrar por preço máximo', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiProperty({ description: 'Ordenar por campo', required: false, default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiProperty({ description: 'Direção da ordenação', required: false, default: 'desc' })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}
