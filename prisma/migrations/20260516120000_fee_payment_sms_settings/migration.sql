-- School master switch for parent fee payment SMS (default off)
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "feePaymentParentSmsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Per-student guardian opt-in for fee payment SMS
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "feePaymentSmsOptIn" BOOLEAN NOT NULL DEFAULT false;
