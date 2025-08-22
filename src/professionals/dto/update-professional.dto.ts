import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class UpdateProfessionalDto {
    @ApiProperty({ description: 'Nome completo do profissional', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Email do profissional', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ description: 'Telefone do profissional', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ description: 'Especialidade do profissional', required: false })
    @IsOptional()
    @IsString()
    specialty?: string;

    @ApiProperty({ description: 'Número da licença profissional', required: false })
    @IsOptional()
    @IsString()
    license?: string;

    @ApiProperty({ description: 'CPF do profissional', required: false })
    @IsOptional()
    @IsString()
    document?: string;

    @ApiProperty({ description: 'Data de nascimento', required: false })
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @ApiProperty({ description: 'Gênero', enum: Gender, required: false })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

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

    @ApiProperty({ description: 'Data de contratação', required: false })
    @IsOptional()
    @IsDateString()
    hireDate?: string;

    @ApiProperty({ description: 'Salário', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    salary?: number;

    @ApiProperty({ description: 'Observações gerais', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ description: 'Status ativo do profissional', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
