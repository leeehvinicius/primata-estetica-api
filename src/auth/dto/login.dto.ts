import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@primata.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123', minLength: 6 })
  @MinLength(6)
  password: string;
}
