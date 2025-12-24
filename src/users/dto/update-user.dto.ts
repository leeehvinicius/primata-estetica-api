import {
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário', required: false })
  @IsOptional()
  @MinLength(3)
  name?: string;

  @ApiProperty({ description: 'Email do usuário', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    description: 'Nova senha do usuário (mínimo 6 caracteres)', 
    required: false,
    minLength: 6 
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password?: string;

  @ApiProperty({
    description: 'Role do usuário no sistema',
    enum: Role,
    required: false,
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

  @ApiProperty({ description: 'Status ativo do usuário', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
