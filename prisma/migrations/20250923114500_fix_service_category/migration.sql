-- Add ServiceCategory table and migrate Service.category (enum) -> serviceCategoryId (FK)

-- 0) Renomear o enum existente para evitar conflito de nome com a nova tabela
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ServiceCategory'
  ) THEN
    ALTER TYPE "public"."ServiceCategory" RENAME TO "ServiceCategoryEnum";
  END IF;
END$$;
-- 1) Create table ServiceCategory
CREATE TABLE IF NOT EXISTS "public"."ServiceCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- 2) Seed categories based on existing enum values if not present
-- We will insert rows for each known enum label if they don't exist yet, using deterministic IDs
-- Deterministic IDs derived from labels to avoid duplicates across reruns
INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_facial_treatment', 'FACIAL_TREATMENT', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'FACIAL_TREATMENT');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_body_treatment', 'BODY_TREATMENT', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'BODY_TREATMENT');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_hair_removal', 'HAIR_REMOVAL', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'HAIR_REMOVAL');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_skin_cleaning', 'SKIN_CLEANING', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'SKIN_CLEANING');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_aesthetic_procedure', 'AESTHETIC_PROCEDURE', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'AESTHETIC_PROCEDURE');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_consultation', 'CONSULTATION', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'CONSULTATION');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_maintenance', 'MAINTENANCE', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'MAINTENANCE');

INSERT INTO "public"."ServiceCategory" ("id", "name", "description", "isActive", "createdBy", "createdAt", "updatedAt")
SELECT 'svc_cat_other', 'OTHER', NULL, true, COALESCE((SELECT "id" FROM "public"."User" LIMIT 1), 'system'), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "public"."ServiceCategory" WHERE "name" = 'OTHER');

-- 3) Add serviceCategoryId column (nullable first to allow backfill)
ALTER TABLE "public"."Service" ADD COLUMN IF NOT EXISTS "serviceCategoryId" TEXT;

-- 4) Backfill serviceCategoryId from old enum column "category"
UPDATE "public"."Service" s
SET "serviceCategoryId" = sc."id"
FROM "public"."ServiceCategory" sc
WHERE sc."name" = s."category"::text
  AND s."serviceCategoryId" IS NULL;

-- 5) Add FK constraint
-- Note: PostgreSQL doesn't support IF NOT EXISTS on ADD CONSTRAINT
-- Ensure idempotency by checking existence via pg_constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid AND t.relname = 'Service'
    WHERE c.conname = 'Service_serviceCategoryId_fkey'
  ) THEN
    ALTER TABLE "public"."Service"
      ADD CONSTRAINT "Service_serviceCategoryId_fkey"
      FOREIGN KEY ("serviceCategoryId") REFERENCES "public"."ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

-- 6) Set NOT NULL after backfill if all rows populated; if some nulls remain, leave nullable to avoid migration failure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "public"."Service" WHERE "serviceCategoryId" IS NULL
  ) THEN
    ALTER TABLE "public"."Service" ALTER COLUMN "serviceCategoryId" SET NOT NULL;
  END IF;
END$$;

-- 7) Optional: Drop old enum column if Prisma no longer uses it
-- Only drop if all rows have serviceCategoryId populated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "public"."Service" WHERE "serviceCategoryId" IS NULL
  ) THEN
    -- Drop constraints referencing old column if any (none expected)
    -- Drop old column "category"
    ALTER TABLE "public"."Service" DROP COLUMN IF EXISTS "category";
    -- Drop old type if no longer in use anywhere
    DROP TYPE IF EXISTS "public"."ServiceCategoryEnum";
  END IF;
END$$;


