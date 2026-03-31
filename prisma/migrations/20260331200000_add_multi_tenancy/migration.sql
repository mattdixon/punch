-- CreateEnum: Add OWNER to Role
-- Prisma doesn't support ALTER TYPE directly, so we need to recreate
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- CreateTable: Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoBase64" TEXT,
    "defaultPaymentTerms" TEXT NOT NULL DEFAULT 'Net 15',
    "defaultBillCents" INTEGER NOT NULL DEFAULT 0,
    "defaultPayCents" INTEGER NOT NULL DEFAULT 0,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- Migrate CompanySettings data to Organization
INSERT INTO "Organization" ("id", "companyName", "slug", "logoBase64", "defaultPaymentTerms", "defaultBillCents", "defaultPayCents", "defaultCurrency", "fiscalYearStartMonth", "createdAt", "updatedAt")
SELECT
    'default-org',
    COALESCE("companyName", 'Punch'),
    'default',
    "logoBase64",
    COALESCE("defaultPaymentTerms", 'Net 15'),
    COALESCE("defaultBillCents", 0),
    COALESCE("defaultPayCents", 0),
    COALESCE("defaultCurrency", 'USD'),
    COALESCE("fiscalYearStartMonth", 1),
    "createdAt",
    "updatedAt"
FROM "CompanySettings"
WHERE "id" = 'default'
ON CONFLICT DO NOTHING;

-- If no CompanySettings existed, create a default org
INSERT INTO "Organization" ("id", "companyName", "slug", "defaultPaymentTerms", "defaultBillCents", "defaultPayCents", "defaultCurrency", "fiscalYearStartMonth", "createdAt", "updatedAt")
SELECT 'default-org', 'Punch', 'default', 'Net 15', 0, 0, 'USD', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Organization" WHERE "id" = 'default-org');

-- Add orgId column to User (nullable first)
ALTER TABLE "User" ADD COLUMN "orgId" TEXT;

-- Populate all existing users with default org
UPDATE "User" SET "orgId" = 'default-org' WHERE "orgId" IS NULL;

-- Make orgId NOT NULL
ALTER TABLE "User" ALTER COLUMN "orgId" SET NOT NULL;

-- Add FK and index
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- Add orgId column to Client (nullable first)
ALTER TABLE "Client" ADD COLUMN "orgId" TEXT;

-- Populate all existing clients with default org
UPDATE "Client" SET "orgId" = 'default-org' WHERE "orgId" IS NULL;

-- Make orgId NOT NULL
ALTER TABLE "Client" ALTER COLUMN "orgId" SET NOT NULL;

-- Add FK and index
ALTER TABLE "Client" ADD CONSTRAINT "Client_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Client_orgId_idx" ON "Client"("orgId");

-- Add orgId column to Project (nullable first)
ALTER TABLE "Project" ADD COLUMN "orgId" TEXT;

-- Populate all existing projects with default org
UPDATE "Project" SET "orgId" = 'default-org' WHERE "orgId" IS NULL;

-- Make orgId NOT NULL
ALTER TABLE "Project" ALTER COLUMN "orgId" SET NOT NULL;

-- Add FK and index
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Project_orgId_idx" ON "Project"("orgId");

-- Drop CompanySettings table
DROP TABLE "CompanySettings";
