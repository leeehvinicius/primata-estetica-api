import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    clientId: string;

    @ApiProperty({ required: false })
    appointmentId?: string;

    @ApiProperty()
    serviceId: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    discountAmount: number;

    @ApiProperty()
    finalAmount: number;

    @ApiProperty({ enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty({ enum: PaymentStatus })
    paymentStatus: PaymentStatus;

    @ApiProperty()
    paymentDate: Date;

    @ApiProperty({ required: false })
    dueDate?: Date;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ required: false })
    transactionId?: string;

    @ApiProperty({ required: false })
    receiptNumber?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    // Relacionamentos
    @ApiProperty({ required: false })
    client?: any;

    @ApiProperty({ required: false })
    appointment?: any;

    @ApiProperty({ required: false })
    service?: any;
}

export class PaymentListResponseDto {
    @ApiProperty({ type: [PaymentResponseDto] })
    payments: PaymentResponseDto[];

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

export class PaymentStatsResponseDto {
    @ApiProperty()
    total: number;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty()
    totalPaid: number;

    @ApiProperty()
    totalPending: number;

    @ApiProperty()
    totalOverdue: number;

    @ApiProperty()
    totalRefunded: number;

    @ApiProperty()
    byMethod: Record<PaymentMethod, number>;

    @ApiProperty()
    byStatus: Record<PaymentStatus, number>;

    @ApiProperty()
    today: number;

    @ApiProperty()
    thisWeek: number;

    @ApiProperty()
    thisMonth: number;

    @ApiProperty()
    averageAmount: number;
}

export class ReceiptResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    paymentId: string;

    @ApiProperty()
    receiptNumber: string;

    @ApiProperty()
    receiptType: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    issuedAt: Date;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class CommissionResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    paymentId: string;

    @ApiProperty()
    professionalId: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    percentage: number;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    paidAt?: Date;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    // Relacionamentos
    @ApiProperty({ required: false })
    professional?: any;
}
