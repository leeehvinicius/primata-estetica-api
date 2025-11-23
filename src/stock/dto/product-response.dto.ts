import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ required: false })
  supplierId?: string;

  @ApiProperty({ required: false })
  sku?: string;

  @ApiProperty({ required: false })
  barcode?: string;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  minStock: number;

  @ApiProperty({ required: false })
  maxStock?: number;

  @ApiProperty()
  costPrice: number;

  @ApiProperty()
  salePrice: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  requiresPrescription: boolean;

  @ApiProperty({ required: false })
  expirationDate?: Date;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relacionamentos
  @ApiProperty({ required: false })
  category?: any;

  @ApiProperty({ required: false })
  supplier?: any;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}

export class StockStatsResponseDto {
  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  activeProducts: number;

  @ApiProperty()
  lowStockProducts: number;

  @ApiProperty()
  outOfStockProducts: number;

  @ApiProperty()
  expiringSoonProducts: number;

  @ApiProperty()
  expiredProducts: number;

  @ApiProperty()
  totalStockValue: number;

  @ApiProperty()
  averageStockValue: number;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty()
  byUnit: Record<string, number>;
}

export class ProductCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  productCount: number;
}

export class SupplierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ required: false })
  document?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  state?: string;

  @ApiProperty({ required: false })
  zipCode?: string;

  @ApiProperty({ required: false })
  contactPerson?: string;

  @ApiProperty({ required: false })
  contactPhone?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  productCount: number;
}

export class StockMovementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  movementType: string;

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

export class StockAlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  alertType: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  resolvedAt?: Date;

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
