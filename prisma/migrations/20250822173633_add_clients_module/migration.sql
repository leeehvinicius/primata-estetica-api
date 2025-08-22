-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."SkinType" AS ENUM ('NORMAL', 'DRY', 'OILY', 'COMBINATION', 'SENSITIVE', 'ACNE_PRONE');

-- CreateEnum
CREATE TYPE "public"."BudgetRange" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."PreferredTime" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('CONSULTATION', 'TREATMENT', 'PROCEDURE', 'FOLLOW_UP', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."TreatmentStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" "public"."Gender",
    "document" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientPreference" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "skinType" "public"."SkinType",
    "allergies" TEXT,
    "medications" TEXT,
    "contraindications" TEXT,
    "goals" TEXT,
    "budget" "public"."BudgetRange",
    "preferredTime" "public"."PreferredTime",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" "public"."ServiceType" NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicalHistory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "severity" "public"."Severity" NOT NULL DEFAULT 'MILD',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Treatment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "sessions" INTEGER NOT NULL DEFAULT 1,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."TreatmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "results" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "public"."Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_document_key" ON "public"."Client"("document");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPreference_clientId_key" ON "public"."ClientPreference"("clientId");

-- AddForeignKey
ALTER TABLE "public"."ClientPreference" ADD CONSTRAINT "ClientPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicalHistory" ADD CONSTRAINT "MedicalHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicalHistory" ADD CONSTRAINT "MedicalHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Treatment" ADD CONSTRAINT "Treatment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Treatment" ADD CONSTRAINT "Treatment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
