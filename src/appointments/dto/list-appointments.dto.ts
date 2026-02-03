import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AppointmentType,
  AppointmentStatus,
  AppointmentPriority,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class ListAppointmentsDto {
  @ApiProperty({ description: 'Página atual', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 10;

  @ApiProperty({ description: 'Buscar por nome do cliente', required: false })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({
    description: 'Buscar por nome do profissional',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty({
    description: 'Filtrar por tipo de agendamento',
    enum: AppointmentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @ApiProperty({
    description: 'Filtrar por status',
    enum: AppointmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Filtrar por prioridade',
    enum: AppointmentPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @ApiProperty({ description: 'Data de início (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Ordenar por campo',
    required: false,
    default: 'scheduledDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledDate';

  @ApiProperty({
    description: 'Direção da ordenação',
    required: false,
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
