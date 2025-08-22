import { IsString, IsOptional, IsEnum, IsNumber, Min, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
    @ApiProperty({ description: 'ID do cliente' })
    @IsUUID()
    clientId: string;

    @ApiProperty({ description: 'ID do agendamento (opcional)', required: false })
    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @ApiProperty({ description: 'ID do serviço' })
    @IsUUID()
    serviceId: string;

    @ApiProperty({ description: 'Valor do pagamento' })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ description: 'Valor do desconto', required: false, default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discountAmount?: number;

    @ApiProperty({ description: 'Método de pagamento', enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: 'Status do pagamento', enum: PaymentStatus, required: false, default: 'PENDING' })
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

    @ApiProperty({ description: 'Gerar recibo automaticamente', required: false, default: true })
    @IsOptional()
    generateReceipt?: boolean;
}
