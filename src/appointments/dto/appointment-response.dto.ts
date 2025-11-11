import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus, AppointmentPriority } from '@prisma/client';

export class AppointmentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    clientId: string;

    @ApiProperty({ required: false })
    professionalId?: string;

    @ApiProperty()
    serviceId: string;

    @ApiProperty({ required: false })
    partnerId?: string;

    @ApiProperty()
    scheduledDate: Date;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;

    @ApiProperty()
    duration: number;

    @ApiProperty({ enum: AppointmentStatus })
    status: AppointmentStatus;

    @ApiProperty({ enum: AppointmentType })
    appointmentType: AppointmentType;

    @ApiProperty({ enum: AppointmentPriority })
    priority: AppointmentPriority;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ required: false })
    cancellationReason?: string;

    @ApiProperty({ required: false })
    rescheduledFrom?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ required: false, description: 'Informações de preço/desconto aplicadas via parceiro' })
    pricing?: {
        amount: number;
        partnerDiscountPercentage: number;
        clientDiscountPercentage?: number;
        fixedDiscountAmount?: number;
        partnerDiscountAmount: number;
        finalAmount: number;
        partnerId?: string;
    };

    // Relacionamentos
    @ApiProperty({ required: false })
    client?: any;

    @ApiProperty({ required: false })
    professional?: any;

    @ApiProperty({ required: false })
    service?: any;

    @ApiProperty({ 
        required: false, 
        description: 'Parceiro que indicou (quem indicou)',
        example: {
            id: 'string',
            name: 'string',
            document: 'string',
            partnerDiscount: 10.00,
            clientDiscount: 5.00,
            fixedDiscount: 50.00
        }
    })
    partner?: {
        id: string;
        name: string;
        document: string;
        partnerDiscount: number;
        clientDiscount: number;
        fixedDiscount?: number | null;
    };
}

export class AppointmentListResponseDto {
    @ApiProperty({ type: [AppointmentResponseDto] })
    appointments: AppointmentResponseDto[];

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

export class AppointmentStatsResponseDto {
    @ApiProperty()
    total: number;

    @ApiProperty()
    scheduled: number;

    @ApiProperty()
    confirmed: number;

    @ApiProperty()
    completed: number;

    @ApiProperty()
    cancelled: number;

    @ApiProperty()
    noShow: number;

    @ApiProperty()
    byType: Record<AppointmentType, number>;

    @ApiProperty()
    byStatus: Record<AppointmentStatus, number>;

    @ApiProperty()
    byPriority: Record<AppointmentPriority, number>;

    @ApiProperty()
    today: number;

    @ApiProperty()
    thisWeek: number;

    @ApiProperty()
    thisMonth: number;
}

export class AvailabilityResponseDto {
    @ApiProperty()
    date: string;

    @ApiProperty()
    availableSlots: string[];

    @ApiProperty()
    busySlots: string[];

    @ApiProperty()
    professionalId?: string;

    @ApiProperty()
    serviceId?: string;
}
