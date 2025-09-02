import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';

export class ServiceResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ enum: ServiceCategory })
    category: ServiceCategory;

    @ApiProperty()
    duration: number;

    @ApiProperty()
    basePrice: number;

    @ApiProperty()
    currentPrice: number;

    @ApiProperty()
    requiresProfessional: boolean;

    @ApiProperty()
    maxConcurrentClients: number;

    @ApiProperty({ required: false })
    preparationTime?: number;

    @ApiProperty({ required: false })
    recoveryTime?: number;

    @ApiProperty({ required: false })
    contraindications?: string;

    @ApiProperty({ required: false })
    benefits?: string;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ required: false, description: 'Cor do serviço (hex)' })
    color?: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class ServiceListResponseDto {
    @ApiProperty({ type: [ServiceResponseDto] })
    services: ServiceResponseDto[];

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

export class ServiceStatsResponseDto {
    @ApiProperty()
    total: number;

    @ApiProperty()
    active: number;

    @ApiProperty()
    inactive: number;

    @ApiProperty()
    byCategory: Record<ServiceCategory, number>;

    @ApiProperty()
    averagePrice: number;

    @ApiProperty()
    totalRevenue: number;

    @ApiProperty()
    newThisMonth: number;

    @ApiProperty()
    newThisYear: number;
}
