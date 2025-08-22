import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export class FinancialReportDto {
  @ApiProperty({ description: 'Período do relatório', enum: ReportPeriod, default: ReportPeriod.MONTHLY })
  @IsEnum(ReportPeriod)
  period: ReportPeriod = ReportPeriod.MONTHLY;

  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Incluir detalhes por serviço', required: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeServiceDetails?: boolean;

  @ApiProperty({ description: 'Incluir detalhes por profissional', required: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeProfessionalDetails?: boolean;

  @ApiProperty({ description: 'Incluir detalhes por método de pagamento', required: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includePaymentMethodDetails?: boolean;
}

export class FinancialReportResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalExpenses: number;

  @ApiProperty()
  netProfit: number;

  @ApiProperty()
  totalCommissions: number;

  @ApiProperty()
  totalDiscounts: number;

  @ApiProperty()
  averageTicket: number;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  revenueGrowth: number;

  @ApiProperty()
  profitMargin: number;

  @ApiProperty({ required: false })
  serviceDetails?: any[];

  @ApiProperty({ required: false })
  professionalDetails?: any[];

  @ApiProperty({ required: false })
  paymentMethodDetails?: any[];

  @ApiProperty()
  dailyRevenue?: any[];

  @ApiProperty()
  monthlyComparison?: any[];
}
