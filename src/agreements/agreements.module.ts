import { Module } from '@nestjs/common';
import { AgreementsController } from './agreements.controller';
import { AgreementsService } from './agreements.service';
import { HealthPlanService } from './services/health-plan.service';
import { AgreementService } from './services/agreement.service';
import { AgreementDiscountService } from './services/agreement-discount.service';
import { CoverageLimitService } from './services/coverage-limit.service';
import { AgreementPaymentService } from './services/agreement-payment.service';
import { CoverageAlertService } from './services/coverage-alert.service';
import { OperatorIntegrationService } from './services/operator-integration.service';
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
  controllers: [AgreementsController],
  providers: [
    AgreementsService,
    HealthPlanService,
    AgreementService,
    AgreementDiscountService,
    CoverageLimitService,
    AgreementPaymentService,
    CoverageAlertService,
    OperatorIntegrationService,
  ],
  exports: [
    AgreementsService,
    HealthPlanService,
    AgreementService,
    AgreementDiscountService,
    CoverageLimitService,
    AgreementPaymentService,
    CoverageAlertService,
    OperatorIntegrationService,
  ],
})
export class AgreementsModule {}
