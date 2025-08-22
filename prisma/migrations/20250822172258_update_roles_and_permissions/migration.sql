/*
  Warnings:

  - The values [ADMIN,DOCTOR,RECEPTION] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'SERVICOS_GERAIS');
ALTER TABLE "public"."Profile" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."Profile" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."Profile" ALTER COLUMN "role" SET DEFAULT 'RECEPCIONISTA';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'RECEPCIONISTA';
