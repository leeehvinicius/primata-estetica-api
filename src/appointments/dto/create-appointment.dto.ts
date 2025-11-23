import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType, AppointmentPriority } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'ID do profissional (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ description: 'ID do serviço' })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: 'Data do agendamento (YYYY-MM-DD)' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ description: 'Horário de início (HH:MM)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'ID do parceiro (opcional)', required: false })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiProperty({ description: 'Tipo de agendamento', enum: AppointmentType })
  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @ApiProperty({
    description: 'Prioridade do agendamento',
    enum: AppointmentPriority,
    required: false,
    default: 'NORMAL',
  })
  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @ApiProperty({ description: 'Observações do agendamento', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Canais de notificação',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationChannels?: string[];
}
