ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "School_customDomain_key" ON "School"("customDomain");
