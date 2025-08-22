import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class UpdateClientDto {
    @ApiProperty({ description: 'Nome completo do cliente', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Email do cliente', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ description: 'Telefone do cliente', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ description: 'Data de nascimento', required: false })
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @ApiProperty({ description: 'Gênero', enum: Gender, required: false })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({ description: 'CPF do cliente', required: false })
    @IsOptional()
    @IsString()
    document?: string;

    @ApiProperty({ description: 'Endereço', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ description: 'Cidade', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ description: 'Estado', required: false })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiProperty({ description: 'CEP', required: false })
    @IsOptional()
    @IsString()
    zipCode?: string;

    @ApiProperty({ description: 'Contato de emergência', required: false })
    @IsOptional()
    @IsString()
    emergencyContact?: string;

    @ApiProperty({ description: 'Telefone de emergência', required: false })
    @IsOptional()
    @IsString()
    emergencyPhone?: string;

    @ApiProperty({ description: 'Observações gerais', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ description: 'Status ativo do cliente', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
