import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FinancialReportDto, ReportPeriod } from './dto/financial-report.dto';
import { ProfessionalPerformanceDto } from './dto/professional-performance.dto';
import {
  AppointmentReportDto,
  ServiceAnalysisDto,
  AppointmentReportType,
} from './dto/appointment-report.dto';
import { DashboardResponseDto, GeneralReportDto } from './dto/dashboard.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Reports & Analytics')
@Controller('reports')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ===== DASHBOARD =====
  @ApiOperation({ summary: 'Obter dados do dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Dados do dashboard',
    type: DashboardResponseDto,
  })
  @Get('dashboard')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('dashboard', 'read')
  @UseGuards(RolePermissionGuard)
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  // ===== RELATÓRIOS FINANCEIROS =====
  @ApiOperation({ summary: 'Gerar relatório financeiro' })
  @ApiResponse({
    status: 200,
    description: 'Relatório financeiro gerado com sucesso',
  })
  @Post('financial')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  generateFinancialReport(@Body() dto: FinancialReportDto) {
    return this.reportsService.generateFinancialReport(dto);
  }

  // ===== RELATÓRIOS DE DESEMPENHO DOS PROFISSIONAIS =====
  @ApiOperation({ summary: 'Gerar relatório de desempenho dos profissionais' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de desempenho gerado com sucesso',
  })
  @Post('professional-performance')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  generateProfessionalPerformanceReport(
    @Body() dto: ProfessionalPerformanceDto,
  ) {
    return this.reportsService.generateProfessionalPerformanceReport(dto);
  }

  // ===== RELATÓRIOS DE AGENDAMENTOS =====
  @ApiOperation({ summary: 'Gerar relatório de agendamentos' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de agendamentos gerado com sucesso',
  })
  @Post('appointments')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  generateAppointmentReport(@Body() dto: AppointmentReportDto) {
    return this.reportsService.generateAppointmentReport(dto);
  }

  // ===== ANÁLISE DE SERVIÇOS =====
  @ApiOperation({ summary: 'Gerar análise de serviços' })
  @ApiResponse({
    status: 200,
    description: 'Análise de serviços gerada com sucesso',
  })
  @Post('service-analysis')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  generateServiceAnalysis(@Body() dto: ServiceAnalysisDto) {
    return this.reportsService.generateServiceAnalysis(dto);
  }

  // ===== RELATÓRIOS RÁPIDOS =====
  @ApiOperation({ summary: 'Relatório financeiro rápido - mensal' })
  @ApiResponse({ status: 200, description: 'Relatório financeiro mensal' })
  @Get('financial/monthly')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  getMonthlyFinancialReport() {
    return this.reportsService.generateFinancialReport({
      period: ReportPeriod.MONTHLY,
      includeServiceDetails: true,
      includeProfessionalDetails: false,
      includePaymentMethodDetails: true,
    });
  }

  @ApiOperation({ summary: 'Relatório financeiro rápido - semanal' })
  @ApiResponse({ status: 200, description: 'Relatório financeiro semanal' })
  @Get('financial/weekly')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  getWeeklyFinancialReport() {
    return this.reportsService.generateFinancialReport({
      period: ReportPeriod.WEEKLY,
      includeServiceDetails: false,
      includeProfessionalDetails: false,
      includePaymentMethodDetails: false,
    });
  }

  @ApiOperation({ summary: 'Relatório de agendamentos - hoje' })
  @ApiResponse({ status: 200, description: 'Relatório de agendamentos do dia' })
  @Get('appointments/today')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  getTodayAppointmentsReport() {
    const today = new Date().toISOString().split('T')[0];
    return this.reportsService.generateAppointmentReport({
      reportType: AppointmentReportType.DAILY,
      startDate: today,
      endDate: today,
      includeAppointmentDetails: true,
    });
  }

  @ApiOperation({ summary: 'Relatório de agendamentos - esta semana' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de agendamentos da semana',
  })
  @Get('appointments/this-week')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  getThisWeekAppointmentsReport() {
    const now = new Date();
    const startOfWeek = new Date(
      now.getTime() - now.getDay() * 24 * 60 * 60 * 1000,
    );
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

    return this.reportsService.generateAppointmentReport({
      reportType: AppointmentReportType.WEEKLY,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      includeAppointmentDetails: false,
    });
  }

  @ApiOperation({ summary: 'Top serviços mais solicitados' })
  @ApiResponse({ status: 200, description: 'Top serviços mais solicitados' })
  @Get('services/top')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({
    name: 'topN',
    required: false,
    type: Number,
    description: 'Número de serviços (padrão: 10)',
    default: 10,
  })
  getTopServices(@Query('topN') topN = 10) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.reportsService.generateServiceAnalysis({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      topN: Number(topN),
    });
  }

  @ApiOperation({ summary: 'Desempenho dos profissionais - este mês' })
  @ApiResponse({
    status: 200,
    description: 'Desempenho dos profissionais do mês',
  })
  @Get('professional-performance/this-month')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO)
  @RequirePermission('reports', 'read')
  @UseGuards(RolePermissionGuard)
  getThisMonthProfessionalPerformance() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.reportsService.generateProfessionalPerformanceReport({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      includeAppointmentDetails: false,
      includeCommissionDetails: true,
    });
  }
}
