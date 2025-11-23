import { Module } from '@nestjs/common';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PhotoCaptureService } from './services/photo-capture.service';
import { LocationService } from './services/location.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService, PhotoCaptureService, LocationService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
