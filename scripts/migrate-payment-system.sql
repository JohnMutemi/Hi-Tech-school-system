-- Migration script for Payment System Enhancement
-- Run this script to add payment method configuration and email notification support

-- Add new models for payment method configuration
CREATE TABLE IF NOT EXISTS "PaymentMethodConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL,
    "configuration" TEXT NOT NULL, -- JSON
    "instructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentMethodConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add indexes for PaymentMethodConfig
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_schoolId_methodType_idx" ON "PaymentMethodConfig"("schoolId", "methodType");
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_schoolId_isActive_idx" ON "PaymentMethodConfig"("schoolId", "isActive");

-- Add email notification configuration table
CREATE TABLE IF NOT EXISTS "EmailNotificationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailProvider" TEXT NOT NULL,
    "configuration" TEXT NOT NULL, -- JSON
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "paymentConfirmationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "receiptAttachmentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailNotificationConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add unique constraint for EmailNotificationConfig
CREATE UNIQUE INDEX IF NOT EXISTS "EmailNotificationConfig_schoolId_key" ON "EmailNotificationConfig"("schoolId");

-- Add payment notification log table
CREATE TABLE IF NOT EXISTS "PaymentNotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" DATETIME,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for PaymentNotificationLog
CREATE INDEX IF NOT EXISTS "PaymentNotificationLog_paymentId_idx" ON "PaymentNotificationLog"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentNotificationLog_recipientEmail_emailType_idx" ON "PaymentNotificationLog"("recipientEmail", "emailType");

-- Add sample payment method configurations for existing schools
-- Note: These are example configurations. Schools should configure their own payment methods.

-- Example: Add M-PESA Paybill configuration for a school (update schoolId as needed)
-- INSERT INTO "PaymentMethodConfig" (
--     "id", "schoolId", "methodType", "displayName", "configuration", 
--     "instructions", "isDefault", "isActive"
-- ) VALUES (
--     'pm_' || hex(randomblob(16)),
--     'your-school-id-here',
--     'mpesa_paybill',
--     'School M-PESA Paybill',
--     '{"businessShortCode":"123456","passkey":"your-passkey-here"}',
--     'Pay using M-PESA Paybill:\n1. Go to M-PESA menu\n2. Select Pay Bill\n3. Enter Business Number: 123456\n4. Enter Account Number: your-admission-number\n5. Enter Amount\n6. Enter PIN\n7. Confirm payment',
--     true,
--     true
-- );

-- Add triggers to update updatedAt timestamp
CREATE TRIGGER IF NOT EXISTS update_PaymentMethodConfig_updatedAt 
    AFTER UPDATE ON PaymentMethodConfig 
    FOR EACH ROW 
    BEGIN 
        UPDATE PaymentMethodConfig SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER IF NOT EXISTS update_EmailNotificationConfig_updatedAt 
    AFTER UPDATE ON EmailNotificationConfig 
    FOR EACH ROW 
    BEGIN 
        UPDATE EmailNotificationConfig SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER IF NOT EXISTS update_PaymentNotificationLog_updatedAt 
    AFTER UPDATE ON PaymentNotificationLog 
    FOR EACH ROW 
    BEGIN 
        UPDATE PaymentNotificationLog SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

-- Migration complete
SELECT 'Payment System Enhancement Migration Completed Successfully' as status;









