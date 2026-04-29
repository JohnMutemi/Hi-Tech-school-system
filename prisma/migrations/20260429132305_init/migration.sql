-- CreateIndex
CREATE INDEX "EmailNotificationConfig_schoolId_idx" ON "EmailNotificationConfig"("schoolId");

-- CreateIndex
CREATE INDEX "PaymentNotificationLog_status_createdAt_idx" ON "PaymentNotificationLog"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentNotificationLog" ADD CONSTRAINT "PaymentNotificationLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
