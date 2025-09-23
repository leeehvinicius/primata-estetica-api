import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductCategoryDto {
    @ApiProperty({ description: 'Nome da categoria', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Descrição da categoria', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Se a categoria está ativa', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}


