-- AlterTable
ALTER TABLE "PromotionCriteria" ADD COLUMN     "maxFeeBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "minGrade" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "promotionType" TEXT NOT NULL DEFAULT 'bulk';

-- CreateTable
CREATE TABLE "BulkPromotionConfig" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "minGrade" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "maxFeeBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxDisciplinaryCases" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkPromotionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BulkPromotionConfig_schoolId_key" ON "BulkPromotionConfig"("schoolId");

-- AddForeignKey
ALTER TABLE "BulkPromotionConfig" ADD CONSTRAINT "BulkPromotionConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
