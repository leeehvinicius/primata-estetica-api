-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('FACIAL_TREATMENT', 'BODY_TREATMENT', 'HAIR_REMOVAL', 'SKIN_CLEANING', 'AESTHETIC_PROCEDURE', 'CONSULTATION', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED', 'FREE');

-- CreateEnum
CREATE TYPE "public"."PromotionType" AS ENUM ('SEASONAL', 'WEEKDAY', 'TIME_BASED', 'VOLUME', 'LOYALTY', 'FIRST_TIME', 'BIRTHDAY', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."ServiceCategory" NOT NULL,
    "duration" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresProfessional" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentClients" INTEGER NOT NULL DEFAULT 1,
    "preparationTime" INTEGER,
    "recoveryTime" INTEGER,
    "contraindications" TEXT,
    "benefits" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "public"."DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "validityDays" INTEGER,
    "maxUses" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "individualPrice" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ServicePackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePromotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promotionType" "public"."PromotionType" NOT NULL,
    "discountType" "public"."DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minPurchase" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "applicableDays" "public"."DayOfWeek"[],
    "applicableHours" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePromotionItem" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "additionalDiscount" DECIMAL(10,2),
    "notes" TEXT,

    CONSTRAINT "ServicePromotionItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePackage" ADD CONSTRAINT "ServicePackage_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePackageItem" ADD CONSTRAINT "ServicePackageItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePromotion" ADD CONSTRAINT "ServicePromotion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePromotionItem" ADD CONSTRAINT "ServicePromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "public"."ServicePromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePromotionItem" ADD CONSTRAINT "ServicePromotionItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
