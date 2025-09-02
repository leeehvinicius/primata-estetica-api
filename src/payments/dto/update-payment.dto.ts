import { IsString, IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
    @ApiProperty({ description: 'ID do agendamento (opcional)', required: false })
    @IsOptional()
    @IsString()
    appointmentId?: string;

    @ApiProperty({ description: 'ID do serviço', required: false })
    @IsOptional()
    @IsString()
    serviceId?: string;

    @ApiProperty({ description: 'Valor do pagamento', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    amount?: number;

    @ApiProperty({ description: 'Valor do desconto', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discountAmount?: number;

    @ApiProperty({ description: 'Método de pagamento', enum: PaymentMethod, required: false })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiProperty({ description: 'Status do pagamento', enum: PaymentStatus, required: false })
    @IsOptional()
    @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @ApiProperty({ description: 'Data de vencimento (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiProperty({ description: 'Observações do pagamento', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ description: 'ID da transação externa', required: false })
    @IsOptional()
    @IsString()
    transactionId?: string;
}
