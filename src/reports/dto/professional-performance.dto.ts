import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalPerformanceDto {
  @ApiProperty({ description: 'ID do profissional (opcional)', required: false })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Incluir detalhes de atendimentos', required: false, default: false })
  @IsOptional()
  includeAppointmentDetails?: boolean;

  @ApiProperty({ description: 'Incluir detalhes de comissões', required: false, default: false })
  @IsOptional()
  includeCommissionDetails?: boolean;
}

export class ProfessionalPerformanceResponseDto {
  @ApiProperty()
  professionalId: string;

  @ApiProperty()
  professionalName: string;

  @ApiProperty()
  period: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  completedAppointments: number;

  @ApiProperty()
  cancelledAppointments: number;

  @ApiProperty()
  noShowAppointments: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalCommissions: number;

  @ApiProperty()
  averageAppointmentValue: number;

  @ApiProperty()
  averageAppointmentsPerDay: number;

  @ApiProperty()
  mostPerformedServices: any[];

  @ApiProperty()
  clientSatisfaction: number;

  @ApiProperty({ required: false })
  appointmentDetails?: any[];

  @ApiProperty({ required: false })
  commissionDetails?: any[];

  @ApiProperty()
  monthlyPerformance?: any[];
}

export class ProfessionalComparisonDto {
  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ProfessionalComparisonResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  professionals: any[];

  @ApiProperty()
  topPerformers: any[];

  @ApiProperty()
  averageMetrics: any;
}
