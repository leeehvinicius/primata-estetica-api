-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('CPF', 'CNPJ');

-- AlterTable
ALTER TABLE "public"."AgreementDiscount" ADD COLUMN     "discountValue" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "additionalValue" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "public"."Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "document" TEXT NOT NULL,
    "partnerDiscount" DECIMAL(5,2) NOT NULL,
    "clientDiscount" DECIMAL(5,2) NOT NULL,
    "fixedDiscount" DECIMAL(10,2),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_document_key" ON "public"."Partner"("document");

-- AddForeignKey
ALTER TABLE "public"."Partner" ADD CONSTRAINT "Partner_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
