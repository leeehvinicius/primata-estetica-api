import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @IsEmail() email: string;
    @MinLength(3) name: string;
    @MinLength(6) password: string;
}