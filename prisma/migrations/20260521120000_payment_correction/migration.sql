-- CreateTable
CREATE TABLE "PaymentCorrection" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "previousAmount" DOUBLE PRECISION NOT NULL,
    "newAmount" DOUBLE PRECISION NOT NULL,
    "previousReferenceNumber" TEXT,
    "newReferenceNumber" TEXT,
    "previousTermId" TEXT NOT NULL,
    "newTermId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "correctedById" TEXT NOT NULL,
    "correctedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentCorrection_paymentId_createdAt_idx" ON "PaymentCorrection"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentCorrection_schoolId_createdAt_idx" ON "PaymentCorrection"("schoolId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentCorrection" ADD CONSTRAINT "PaymentCorrection_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCorrection" ADD CONSTRAINT "PaymentCorrection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCorrection" ADD CONSTRAINT "PaymentCorrection_correctedById_fkey" FOREIGN KEY ("correctedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
