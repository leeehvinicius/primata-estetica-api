import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import {
  AppointmentResponseDto,
  AppointmentListResponseDto,
  AppointmentStatsResponseDto,
  AvailabilityResponseDto,
} from './dto/appointment-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
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

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAccessGuard, RolesGuard)
export class AppointmentsController {
  constructor(private appointments: AppointmentsService) {}

  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Horário não disponível' })
  @Post()
  @Roles(
    Role.ADMINISTRADOR,
    Role.MEDICO,
    Role.RECEPCIONISTA,
    Role.TÉCNICO_DE_ENFERMAGEM,
  )
  @RequirePermission('appointments', 'create')
  @UseGuards(RolePermissionGuard)
  create(@Body() dto: CreateAppointmentDto, @GetUser() user: any) {
    return this.appointments.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Listar agendamentos com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos',
    type: AppointmentListResponseDto,
  })
  @Get()
  @Roles(
    Role.ADMINISTRADOR,
    Role.MEDICO,
    Role.RECEPCIONISTA,
    Role.TECNICO,
    Role.ESTAGIARIO,
    Role.TÉCNICO_DE_ENFERMAGEM,
  )
  @RequirePermission('appointments', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página atual',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página',
  })
  @ApiQuery({
    name: 'clientName',
    required: false,
    type: String,
    description: 'Buscar por nome do cliente',
  })
  @ApiQuery({
    name: 'professionalName',
    required: false,
    type: String,
    description: 'Buscar por nome do profissional',
  })
  @ApiQuery({
    name: 'appointmentType',
    required: false,
    enum: [
      'CONSULTATION',
      'TREATMENT',
      'PROCEDURE',
      'FOLLOW_UP',
      'EMERGENCY',
      'MAINTENANCE',
      'EVALUATION',
      'OTHER',
    ],
    description: 'Filtrar por tipo de agendamento',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'SCHEDULED',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED',
      'WAITING',
    ],
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    description: 'Filtrar por prioridade',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data de início (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data de fim (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Campo para ordenação',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Direção da ordenação',
  })
  findAll(@Query() query: ListAppointmentsDto) {
    return this.appointments.findAll(query);
  }

  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do agendamento',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'read')
  @UseGuards(RolePermissionGuard)
  findOne(@Param('id') id: string) {
    return this.appointments.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento atualizado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @Put(':id')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'update')
  @UseGuards(RolePermissionGuard)
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointments.update(id, dto);
  }

  @ApiOperation({ summary: 'Deletar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'delete')
  @UseGuards(RolePermissionGuard)
  remove(@Param('id') id: string) {
    return this.appointments.remove(id);
  }

  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento cancelado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Agendamento já está cancelado' })
  @Patch(':id/cancel')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'update')
  @UseGuards(RolePermissionGuard)
  cancel(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.appointments.cancel(id, body.reason);
  }

  @ApiOperation({ summary: 'Remarcar agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento remarcado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remarcar um agendamento cancelado',
  })
  @ApiResponse({ status: 409, description: 'Novo horário não disponível' })
  @Patch(':id/reschedule')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'update')
  @UseGuards(RolePermissionGuard)
  reschedule(
    @Param('id') id: string,
    @Body() body: { newDate: string; newTime: string },
  ) {
    return this.appointments.reschedule(id, body.newDate, body.newTime);
  }

  @ApiOperation({ summary: 'Estatísticas dos agendamentos' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas dos agendamentos',
    type: AppointmentStatsResponseDto,
  })
  @Get('stats/overview')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA, Role.TECNICO, Role.ESTAGIARIO, Role.TÉCNICO_DE_ENFERMAGEM)
  @RequirePermission('appointments', 'read')
  @UseGuards(RolePermissionGuard)
  getStats() {
    return this.appointments.getStats();
  }

  @ApiOperation({ summary: 'Verificar disponibilidade de horários' })
  @ApiResponse({
    status: 200,
    description: 'Horários disponíveis',
    type: AvailabilityResponseDto,
  })
  @Get('availability/:date')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'read')
  @UseGuards(RolePermissionGuard)
  getAvailableSlots(
    @Param('date') date: string,
    @Query('professionalId') professionalId?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.appointments.getAvailableSlots(date, professionalId, serviceId);
  }

  @ApiOperation({ summary: 'Verificar disponibilidade de horário específico' })
  @ApiResponse({ status: 200, description: 'Disponibilidade do horário' })
  @Get('availability/:date/:startTime/:endTime')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'read')
  @UseGuards(RolePermissionGuard)
  checkAvailability(
    @Param('date') date: string,
    @Param('startTime') startTime: string,
    @Param('endTime') endTime: string,
    @Query('professionalId') professionalId?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.appointments.checkAvailability(
      date,
      startTime,
      endTime,
      professionalId,
      serviceId,
    );
  }

  @ApiOperation({
    summary: 'Enviar lembretes automáticos de agendamentos',
    description:
      'Rota automatizada que envia notificações via WhatsApp para clientes com agendamentos em 1 hora. Esta rota é chamada automaticamente por um cron job a cada 5 minutos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lembretes processados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        totalFound: { type: 'number' },
        sent: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              appointmentId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @Post('send-reminders')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @RequirePermission('appointments', 'update')
  @UseGuards(RolePermissionGuard)
  sendReminders() {
    return this.appointments.sendReminders();
  }
}
