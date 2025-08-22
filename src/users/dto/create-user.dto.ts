import { IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({ description: 'Email do usuário' })
    @IsEmail() 
    email: string;

    @ApiProperty({ description: 'Nome completo do usuário' })
    @MinLength(3) 
    name: string;

    @ApiProperty({ description: 'Senha do usuário (mínimo 6 caracteres)' })
    @MinLength(6) 
    password: string;

    @ApiProperty({ 
        description: 'Role do usuário no sistema',
        enum: Role,
        default: 'RECEPCIONISTA'
    })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiProperty({ description: 'Telefone do usuário', required: false })
    @IsOptional()
    phone?: string;

    @ApiProperty({ description: 'CPF/CNPJ do usuário', required: false })
    @IsOptional()
    document?: string;
}