import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentPriority,
} from '@prisma/client';

export class UpdateAppointmentDto {
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

  @ApiProperty({
    description: 'Data do agendamento (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ description: 'Horário de início (HH:MM)', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    description: 'ID do parceiro (quem indicou)',
    required: false,
  })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiProperty({
    description: 'Tipo de agendamento',
    enum: AppointmentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @ApiProperty({
    description: 'Prioridade do agendamento',
    enum: AppointmentPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @ApiProperty({
    description: 'Status do agendamento',
    enum: AppointmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ description: 'Observações do agendamento', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Motivo do cancelamento', required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
