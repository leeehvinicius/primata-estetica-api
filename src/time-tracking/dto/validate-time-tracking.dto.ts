import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ValidationAction } from '@prisma/client';

export class ValidateTimeTrackingDto {
  @IsString()
  timeTrackingId: string;

  @IsEnum(ValidationAction)
  action: ValidationAction;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;
}
