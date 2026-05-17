-- School public website: profile fields + section content
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "motto" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "principalName" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "establishedYear" INTEGER;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "websiteTemplateSlug" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "colorPaletteSlug" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "publicWebsiteEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "SchoolWebsiteSection" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolWebsiteSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SchoolWebsiteSection_schoolId_sectionKey_key" ON "SchoolWebsiteSection"("schoolId", "sectionKey");
CREATE INDEX IF NOT EXISTS "SchoolWebsiteSection_schoolId_idx" ON "SchoolWebsiteSection"("schoolId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SchoolWebsiteSection_schoolId_fkey'
  ) THEN
    ALTER TABLE "SchoolWebsiteSection" ADD CONSTRAINT "SchoolWebsiteSection_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
