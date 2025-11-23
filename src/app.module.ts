import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { StockModule } from './stock/stock.module';
import { ReportsModule } from './reports/reports.module';
import { SecurityModule } from './security/security.module';
import { ExternalIntegrationModule } from './external-integration/external-integration.module';
// Removido AgreementsModule; substituído por PartnersModule simples
import { PartnersModule } from './partners/partners.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ClientsModule,
    ProfessionalsModule,
    ServicesModule,
    AppointmentsModule,
    PaymentsModule,
    StockModule,
    ReportsModule,
    SecurityModule,
    ExternalIntegrationModule,
    PartnersModule,
    TimeTrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
