import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({ description: 'Nome da categoria de serviço' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição da categoria', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Categoria ativa',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
