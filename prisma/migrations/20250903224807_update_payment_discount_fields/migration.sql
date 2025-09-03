/*
  Warnings:

  - You are about to drop the column `discountAmount` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `clientDiscount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partnerDiscount` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE', 'SESSION_START', 'SESSION_END', 'EXPORT', 'IMPORT', 'BACKUP', 'RESTORE', 'CONFIG_CHANGE', 'SYSTEM_ACCESS', 'DATA_ACCESS', 'ADMIN_ACTION');

-- CreateEnum
CREATE TYPE "public"."AuditSeverity" AS ENUM ('LOW', 'INFO', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."SecurityEventType" AS ENUM ('FAILED_LOGIN', 'MULTIPLE_FAILED_LOGINS', 'BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_ACTIVITY', 'UNAUTHORIZED_ACCESS', 'PRIVILEGE_ESCALATION', 'DATA_BREACH', 'MALWARE_DETECTED', 'SUSPICIOUS_IP', 'ACCOUNT_LOCKOUT', 'PASSWORD_POLICY_VIOLATION', 'SESSION_HIJACK', 'CSRF_ATTEMPT', 'SQL_INJECTION', 'XSS_ATTEMPT', 'RATE_LIMIT_EXCEEDED', 'UNUSUAL_LOGIN_LOCATION', 'UNUSUAL_LOGIN_TIME', 'CONCURRENT_SESSIONS', 'ADMIN_ACCESS');

-- CreateEnum
CREATE TYPE "public"."SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."LoginMethod" AS ENUM ('EMAIL_PASSWORD', 'TWO_FACTOR', 'SSO', 'BIOMETRIC', 'TOKEN');

-- CreateEnum
CREATE TYPE "public"."SecurityConfigCategory" AS ENUM ('AUTHENTICATION', 'AUTHORIZATION', 'SESSION', 'PASSWORD', 'RATE_LIMITING', 'ENCRYPTION', 'LOGGING', 'BACKUP', 'MONITORING', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "public"."IntegrationType" AS ENUM ('PAYMENT', 'ACCOUNTING', 'CRM', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "public"."LimitType" AS ENUM ('PER_SESSION', 'MONTHLY', 'ANNUAL', 'LIFETIME');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('LIMIT_EXCEEDED', 'EXPIRING_SOON', 'INVALID_AGREEMENT', 'COVERAGE_DENIED', 'PAYMENT_DELAYED');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'TÉCNICO_DE_ENFERMAGEM';

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "lastCrmSync" TIMESTAMP(3),
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "discountAmount",
ADD COLUMN     "clientDiscount" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "externalPaymentId" TEXT,
ADD COLUMN     "partnerDiscount" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "color" TEXT;

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "severity" "public"."AuditSeverity" NOT NULL DEFAULT 'INFO',
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" "public"."SecurityEventType" NOT NULL,
    "severity" "public"."SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "location" JSONB,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "location" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "terminatedAt" TIMESTAMP(3),
    "terminatedBy" TEXT,
    "loginMethod" "public"."LoginMethod" NOT NULL DEFAULT 'EMAIL_PASSWORD',
    "deviceFingerprint" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "failureReason" TEXT,
    "userId" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "rateLimited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecurityConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."SecurityConfigCategory" NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationConfiguration" (
    "id" TEXT NOT NULL,
    "type" "public"."IntegrationType" NOT NULL,
    "provider" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentTransactionLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "requestData" JSONB NOT NULL,
    "responseData" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "transactionType" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "operatorCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agreement" (
    "id" TEXT NOT NULL,
    "healthPlanId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "cardNumber" TEXT,
    "validity" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgreementDiscount" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "serviceId" TEXT,
    "packageId" TEXT,
    "discountPercentage" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreementDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoverageLimit" (
    "id" TEXT NOT NULL,
    "healthPlanId" TEXT NOT NULL,
    "serviceId" TEXT,
    "packageId" TEXT,
    "limitAmount" DECIMAL(10,2) NOT NULL,
    "limitType" "public"."LimitType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgreementPayment" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCovered" DECIMAL(10,2) NOT NULL,
    "amountClient" DECIMAL(10,2) NOT NULL,
    "discountApplied" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreementPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoverageAlert" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "serviceId" TEXT,
    "packageId" TEXT,
    "alertType" "public"."AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperatorIntegration" (
    "id" TEXT NOT NULL,
    "healthPlanId" TEXT NOT NULL,
    "integrationType" TEXT NOT NULL,
    "endpoint" TEXT,
    "credentials" JSONB,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "public"."UserSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "public"."UserSession"("refreshToken");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "public"."LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "public"."LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_userId_createdAt_idx" ON "public"."ApiUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_endpoint_createdAt_idx" ON "public"."ApiUsage"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_ipAddress_createdAt_idx" ON "public"."ApiUsage"("ipAddress", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityConfiguration_key_key" ON "public"."SecurityConfiguration"("key");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfiguration_type_provider_key" ON "public"."IntegrationConfiguration"("type", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementDiscount_agreementId_serviceId_packageId_key" ON "public"."AgreementDiscount"("agreementId", "serviceId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageLimit_healthPlanId_serviceId_packageId_key" ON "public"."CoverageLimit"("healthPlanId", "serviceId", "packageId");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityEvent" ADD CONSTRAINT "SecurityEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityEvent" ADD CONSTRAINT "SecurityEvent_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_terminatedBy_fkey" FOREIGN KEY ("terminatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordHistory" ADD CONSTRAINT "PasswordHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiUsage" ADD CONSTRAINT "ApiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiUsage" ADD CONSTRAINT "ApiUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityConfiguration" ADD CONSTRAINT "SecurityConfiguration_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransactionLog" ADD CONSTRAINT "PaymentTransactionLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agreement" ADD CONSTRAINT "Agreement_healthPlanId_fkey" FOREIGN KEY ("healthPlanId") REFERENCES "public"."HealthPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agreement" ADD CONSTRAINT "Agreement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgreementDiscount" ADD CONSTRAINT "AgreementDiscount_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgreementDiscount" ADD CONSTRAINT "AgreementDiscount_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgreementDiscount" ADD CONSTRAINT "AgreementDiscount_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverageLimit" ADD CONSTRAINT "CoverageLimit_healthPlanId_fkey" FOREIGN KEY ("healthPlanId") REFERENCES "public"."HealthPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverageLimit" ADD CONSTRAINT "CoverageLimit_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverageLimit" ADD CONSTRAINT "CoverageLimit_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgreementPayment" ADD CONSTRAINT "AgreementPayment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgreementPayment" ADD CONSTRAINT "AgreementPayment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverageAlert" ADD CONSTRAINT "CoverageAlert_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverageAlert" ADD CONSTRAINT "CoverageAlert_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverageAlert" ADD CONSTRAINT "CoverageAlert_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperatorIntegration" ADD CONSTRAINT "OperatorIntegration_healthPlanId_fkey" FOREIGN KEY ("healthPlanId") REFERENCES "public"."HealthPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
