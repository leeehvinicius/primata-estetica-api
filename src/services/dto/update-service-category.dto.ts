import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateServiceCategoryDto {
    @ApiProperty({ description: 'Nome da categoria de serviço', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Descrição da categoria', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Categoria ativa', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}


