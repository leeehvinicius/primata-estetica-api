import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsSchedulerService } from './appointments-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExternalIntegrationModule } from '../external-integration/external-integration.module';

@Module({
  imports: [PrismaModule, ExternalIntegrationModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsSchedulerService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
