-- CreateEnum
CREATE TYPE "public"."TimeTrackingType" AS ENUM ('ENTRADA', 'SAIDA', 'INTERVALO', 'RETORNO');

-- CreateEnum
CREATE TYPE "public"."TimeTrackingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "public"."ValidationAction" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_INFO');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- CreateTable
CREATE TABLE "public"."TimeTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "photoUrl" TEXT,
    "photoData" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "accuracy" DECIMAL(8,2),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."TimeTrackingType" NOT NULL,
    "status" "public"."TimeTrackingStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "rejectionReason" TEXT,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeTrackingValidation" (
    "id" TEXT NOT NULL,
    "timeTrackingId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "action" "public"."ValidationAction" NOT NULL,
    "reason" TEXT,
    "additionalInfo" TEXT,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeTrackingValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeTrackingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requirePhoto" BOOLEAN NOT NULL DEFAULT true,
    "requireLocation" BOOLEAN NOT NULL DEFAULT true,
    "allowedLocations" JSONB,
    "maxDistanceFromOffice" DECIMAL(8,2),
    "workingHours" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "autoApproval" BOOLEAN NOT NULL DEFAULT false,
    "notificationSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeTrackingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeTrackingReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalHours" DECIMAL(8,2) NOT NULL,
    "regularHours" DECIMAL(8,2) NOT NULL,
    "overtimeHours" DECIMAL(8,2) NOT NULL,
    "breakHours" DECIMAL(8,2) NOT NULL,
    "daysWorked" INTEGER NOT NULL,
    "daysAbsent" INTEGER NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "generatedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeTrackingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeTrackingValidation_timeTrackingId_key" ON "public"."TimeTrackingValidation"("timeTrackingId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeTrackingSettings_userId_key" ON "public"."TimeTrackingSettings"("userId");

-- AddForeignKey
ALTER TABLE "public"."TimeTracking" ADD CONSTRAINT "TimeTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTracking" ADD CONSTRAINT "TimeTracking_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTrackingValidation" ADD CONSTRAINT "TimeTrackingValidation_timeTrackingId_fkey" FOREIGN KEY ("timeTrackingId") REFERENCES "public"."TimeTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTrackingValidation" ADD CONSTRAINT "TimeTrackingValidation_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTrackingSettings" ADD CONSTRAINT "TimeTrackingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTrackingReport" ADD CONSTRAINT "TimeTrackingReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTrackingReport" ADD CONSTRAINT "TimeTrackingReport_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeTrackingReport" ADD CONSTRAINT "TimeTrackingReport_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
