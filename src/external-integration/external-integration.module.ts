import { Module } from '@nestjs/common';
import { ExternalIntegrationController } from './external-integration.controller';
import { ExternalIntegrationService } from './external-integration.service';
import { PaymentIntegrationService } from './services/payment-integration.service';
import { AccountingIntegrationService } from './services/accounting-integration.service';
import { CrmIntegrationService } from './services/crm-integration.service';
import { WebhookService } from './services/webhook.service';
import { ApiIntegrationService } from './services/api-integration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ExternalIntegrationController],
  providers: [
    ExternalIntegrationService,
    PaymentIntegrationService,
    AccountingIntegrationService,
    CrmIntegrationService,
    WebhookService,
    ApiIntegrationService,
  ],
  exports: [
    ExternalIntegrationService,
    PaymentIntegrationService,
    AccountingIntegrationService,
    CrmIntegrationService,
    WebhookService,
    ApiIntegrationService,
  ],
})
export class ExternalIntegrationModule {}
