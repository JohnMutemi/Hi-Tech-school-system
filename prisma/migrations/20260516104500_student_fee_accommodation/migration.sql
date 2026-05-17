-- Student accommodation for fee matching (day scholar vs boarder)
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "feeAccommodation" TEXT NOT NULL DEFAULT 'day_scholar';

-- Optional on termly structure: NULL = unified / legacy (applies to all)
ALTER TABLE "TermlyFeeStructure" ADD COLUMN IF NOT EXISTS "feeAccommodation" TEXT;
