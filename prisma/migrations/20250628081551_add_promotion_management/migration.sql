-- CreateTable
CREATE TABLE "PromotionCriteria" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "minGrade" DOUBLE PRECISION,
    "attendance" INTEGER,
    "feeStatus" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassProgression" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fromClass" TEXT NOT NULL,
    "toClass" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassProgression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClass" TEXT NOT NULL,
    "toClass" TEXT NOT NULL,
    "fromYear" TEXT NOT NULL,
    "toYear" TEXT NOT NULL,
    "promotedBy" TEXT NOT NULL,
    "promotionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criteria" JSONB NOT NULL,
    "notes" TEXT,
    "promotionType" TEXT NOT NULL,

    CONSTRAINT "PromotionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionExclusion" (
    "id" TEXT NOT NULL,
    "promotionLogId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "excludedBy" TEXT NOT NULL,
    "excludedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionExclusion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromotionCriteria" ADD CONSTRAINT "PromotionCriteria_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassProgression" ADD CONSTRAINT "ClassProgression_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionLog" ADD CONSTRAINT "PromotionLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionLog" ADD CONSTRAINT "PromotionLog_promotedBy_fkey" FOREIGN KEY ("promotedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionExclusion" ADD CONSTRAINT "PromotionExclusion_promotionLogId_fkey" FOREIGN KEY ("promotionLogId") REFERENCES "PromotionLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionExclusion" ADD CONSTRAINT "PromotionExclusion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionExclusion" ADD CONSTRAINT "PromotionExclusion_excludedBy_fkey" FOREIGN KEY ("excludedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
