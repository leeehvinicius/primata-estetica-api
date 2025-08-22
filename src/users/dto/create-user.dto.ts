import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail() email: string;
    @MinLength(3) name: string;
    @MinLength(6) password: string;
}