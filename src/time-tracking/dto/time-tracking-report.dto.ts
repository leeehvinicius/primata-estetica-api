import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class GenerateTimeTrackingReportDto {
  @IsString()
  userId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveTimeTrackingReportDto {
  @IsString()
  reportId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TimeTrackingReportQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
