import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductCategoryDto {
    @ApiProperty({ description: 'Nome da categoria' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Descrição da categoria', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Se a categoria está ativa', required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}


