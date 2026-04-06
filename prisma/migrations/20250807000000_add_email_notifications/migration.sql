-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailNotificationConfig" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailProvider" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "paymentConfirmationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "receiptAttachmentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailNotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentNotificationLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailNotificationConfig_schoolId_key" ON "EmailNotificationConfig"("schoolId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentNotificationLog_paymentId_idx" ON "PaymentNotificationLog"("paymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentNotificationLog_recipientEmail_emailType_idx" ON "PaymentNotificationLog"("recipientEmail", "emailType");

-- AddForeignKey
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'EmailNotificationConfig_schoolId_fkey'
    ) THEN
        ALTER TABLE "EmailNotificationConfig" ADD CONSTRAINT "EmailNotificationConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Insert default email configurations for existing schools
INSERT INTO "EmailNotificationConfig" (
    "id",
    "schoolId", 
    "isEnabled", 
    "emailProvider", 
    "configuration", 
    "fromEmail", 
    "fromName",
    "paymentConfirmationEnabled",
    "receiptAttachmentEnabled",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    s."id",
    false, -- Disabled by default, schools need to configure
    'gmail', -- Default to Gmail SMTP
    '{"username": "", "password": ""}', -- Empty config, schools will fill this
    COALESCE(s."email", ''), -- Use school email if available
    s."name",
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "School" s
WHERE NOT EXISTS (
    SELECT 1 FROM "EmailNotificationConfig" enc 
    WHERE enc."schoolId" = s."id"
);





