import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
} from 'class-validator';

export class UpdateTimeTrackingSettingsDto {
  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  requireLocation?: boolean;

  @IsOptional()
  @IsObject()
  allowedLocations?: any; // JSON com locais permitidos

  @IsOptional()
  @IsNumber()
  maxDistanceFromOffice?: number; // em metros

  @IsOptional()
  @IsObject()
  workingHours?: any; // JSON com horários de trabalho

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  autoApproval?: boolean;

  @IsOptional()
  @IsObject()
  notificationSettings?: any; // JSON com configurações de notificação
}
