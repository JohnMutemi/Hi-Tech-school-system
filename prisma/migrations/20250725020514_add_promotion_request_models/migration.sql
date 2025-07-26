-- CreateTable
CREATE TABLE "PromotionRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fromClass" TEXT NOT NULL,
    "toClass" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "requestData" JSONB NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPromotionRequest" (
    "id" TEXT NOT NULL,
    "promotionRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClass" TEXT NOT NULL,
    "toClass" TEXT NOT NULL,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "isGraduating" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "StudentPromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionRequest_schoolId_status_idx" ON "PromotionRequest"("schoolId", "status");

-- CreateIndex
CREATE INDEX "PromotionRequest_submittedBy_submittedAt_idx" ON "PromotionRequest"("submittedBy", "submittedAt");

-- CreateIndex
CREATE INDEX "StudentPromotionRequest_studentId_status_idx" ON "StudentPromotionRequest"("studentId", "status");

-- CreateIndex
CREATE INDEX "StudentPromotionRequest_promotionRequestId_idx" ON "StudentPromotionRequest"("promotionRequestId");

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionRequest" ADD CONSTRAINT "StudentPromotionRequest_promotionRequestId_fkey" FOREIGN KEY ("promotionRequestId") REFERENCES "PromotionRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionRequest" ADD CONSTRAINT "StudentPromotionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
