import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AppointmentReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SERVICE_ANALYSIS = 'service_analysis',
  CLIENT_ANALYSIS = 'client_analysis',
  PROFESSIONAL_ANALYSIS = 'professional_analysis'
}

export class AppointmentReportDto {
  @ApiProperty({ description: 'Tipo de relatório', enum: AppointmentReportType, default: AppointmentReportType.MONTHLY })
  @IsEnum(AppointmentReportType)
  reportType: AppointmentReportType = AppointmentReportType.MONTHLY;

  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'ID do cliente', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'ID do profissional', required: false })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ description: 'ID do serviço', required: false })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ description: 'Incluir detalhes de agendamentos', required: false, default: false })
  @IsOptional()
  includeAppointmentDetails?: boolean;
}

export class AppointmentReportResponseDto {
  @ApiProperty()
  reportType: string;

  @ApiProperty()
  period: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  scheduledAppointments: number;

  @ApiProperty()
  completedAppointments: number;

  @ApiProperty()
  cancelledAppointments: number;

  @ApiProperty()
  noShowAppointments: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  cancellationRate: number;

  @ApiProperty()
  noShowRate: number;

  @ApiProperty()
  averageAppointmentsPerDay: number;

  @ApiProperty()
  peakHours: any[];

  @ApiProperty()
  peakDays: any[];

  @ApiProperty()
  mostRequestedServices: any[];

  @ApiProperty()
  serviceUtilization: any[];

  @ApiProperty({ required: false })
  appointmentDetails?: any[];

  @ApiProperty()
  monthlyTrends?: any[];

  @ApiProperty()
  professionalWorkload?: any[];
}

export class ServiceAnalysisDto {
  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Top N serviços mais solicitados', required: false, default: 10 })
  @IsOptional()
  topN?: number;
}

export class ServiceAnalysisResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  totalServices: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  averageServiceValue: number;

  @ApiProperty()
  mostRequestedServices: any[];

  @ApiProperty()
  highestRevenueServices: any[];

  @ApiProperty()
  serviceGrowth: any[];

  @ApiProperty()
  serviceUtilization: any[];

  @ApiProperty()
  seasonalTrends: any[];
}
