import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Tipo de movimentação', enum: StockMovementType })
  @IsEnum(StockMovementType)
  movementType: StockMovementType;

  @ApiProperty({ description: 'Quantidade movimentada' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Custo unitário', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({
    description: 'Referência da movimentação (pedido, atendimento, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Observações da movimentação', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockMovementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ enum: StockMovementType })
  movementType: StockMovementType;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  previousStock: number;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty({ required: false })
  reference?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relacionamentos
  @ApiProperty({ required: false })
  product?: any;
}
