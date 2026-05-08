-- Add package type for pricing/module gating
ALTER TABLE "School"
ADD COLUMN "packageType" TEXT NOT NULL DEFAULT 'full';
