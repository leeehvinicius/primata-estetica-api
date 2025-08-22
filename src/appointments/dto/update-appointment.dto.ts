import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType, AppointmentPriority, AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
    @ApiProperty({ description: 'ID do profissional (opcional)', required: false })
    @IsOptional()
    @IsUUID()
    professionalId?: string;

    @ApiProperty({ description: 'ID do serviço', required: false })
    @IsOptional()
    @IsUUID()
    serviceId?: string;

    @ApiProperty({ description: 'Data do agendamento (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsDateString()
    scheduledDate?: string;

    @ApiProperty({ description: 'Horário de início (HH:MM)', required: false })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiProperty({ description: 'Tipo de agendamento', enum: AppointmentType, required: false })
    @IsOptional()
    @IsEnum(AppointmentType)
    appointmentType?: AppointmentType;

    @ApiProperty({ description: 'Prioridade do agendamento', enum: AppointmentPriority, required: false })
    @IsOptional()
    @IsEnum(AppointmentPriority)
    priority?: AppointmentPriority;

    @ApiProperty({ description: 'Status do agendamento', enum: AppointmentStatus, required: false })
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
