import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty()
  totalClients: number;

  @ApiProperty()
  totalProfessionals: number;

  @ApiProperty()
  totalServices: number;

  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalPayments: number;

  @ApiProperty()
  pendingPayments: number;

  @ApiProperty()
  todayAppointments: number;

  @ApiProperty()
  thisWeekAppointments: number;

  @ApiProperty()
  thisMonthAppointments: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  averageTicket: number;

  @ApiProperty()
  revenueGrowth: number;

  @ApiProperty()
  clientGrowth: number;

  @ApiProperty()
  topServices: any[];

  @ApiProperty()
  topProfessionals: any[];

  @ApiProperty()
  recentAppointments: any[];

  @ApiProperty()
  recentPayments: any[];

  @ApiProperty()
  stockAlerts: any[];

  @ApiProperty()
  monthlyRevenue: any[];

  @ApiProperty()
  appointmentTrends: any[];
}

export class GeneralReportDto {
  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  endDate?: string;

  @ApiProperty({
    description: 'Incluir gráficos',
    required: false,
    default: true,
  })
  includeCharts?: boolean;

  @ApiProperty({
    description: 'Incluir tabelas detalhadas',
    required: false,
    default: false,
  })
  includeDetailedTables?: boolean;
}

export class GeneralReportResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  summary: any;

  @ApiProperty()
  financialMetrics: any;

  @ApiProperty()
  operationalMetrics: any;

  @ApiProperty()
  clientMetrics: any;

  @ApiProperty()
  professionalMetrics: any;

  @ApiProperty()
  serviceMetrics: any;

  @ApiProperty()
  appointmentMetrics: any;

  @ApiProperty()
  stockMetrics: any;

  @ApiProperty({ required: false })
  charts?: any;

  @ApiProperty({ required: false })
  detailedTables?: any;
}
