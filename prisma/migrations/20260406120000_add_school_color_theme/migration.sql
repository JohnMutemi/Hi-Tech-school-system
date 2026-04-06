-- School portal branding (hex accent). Safe if column already exists (e.g. after `db push`).
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "colorTheme" TEXT;
