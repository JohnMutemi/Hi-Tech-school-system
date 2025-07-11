/*
  Warnings:

  - You are about to drop the column `attendance` on the `PromotionCriteria` table. All the data in the column will be lost.
  - You are about to drop the column `feeStatus` on the `PromotionCriteria` table. All the data in the column will be lost.
  - You are about to drop the column `minGrade` on the `PromotionCriteria` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PromotionExclusion` table. All the data in the column will be lost.
  - You are about to drop the column `criteria` on the `PromotionLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId,classLevel,name]` on the table `PromotionCriteria` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromAcademicYear` to the `ClassProgression` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromGrade` to the `ClassProgression` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAcademicYear` to the `ClassProgression` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toGrade` to the `ClassProgression` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `PromotionCriteria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `criteriaResults` to the `PromotionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromGrade` to the `PromotionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toGrade` to the `PromotionLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PromotionCriteria_schoolId_classLevel_key";

-- AlterTable
ALTER TABLE "ClassProgression" ADD COLUMN     "allowManualOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "criteriaId" TEXT,
ADD COLUMN     "fromAcademicYear" TEXT NOT NULL,
ADD COLUMN     "fromGrade" TEXT NOT NULL,
ADD COLUMN     "requireCriteria" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "toAcademicYear" TEXT NOT NULL,
ADD COLUMN     "toGrade" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PromotionCriteria" DROP COLUMN "attendance",
DROP COLUMN "feeStatus",
DROP COLUMN "minGrade",
ADD COLUMN     "allowPartialPayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "customCriteria" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAbsenceDays" INTEGER,
ADD COLUMN     "maxDisciplinaryCases" INTEGER,
ADD COLUMN     "maxOutstandingBalance" DOUBLE PRECISION,
ADD COLUMN     "maxSubjectFailures" INTEGER,
ADD COLUMN     "minAttendanceRate" DOUBLE PRECISION,
ADD COLUMN     "minAverageGrade" DOUBLE PRECISION,
ADD COLUMN     "minSubjectPasses" INTEGER,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requireAllSubjects" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireCleanRecord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireFullPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireParentConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requirePrincipalApproval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requireTeacherApproval" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PromotionExclusion" DROP COLUMN "notes",
ADD COLUMN     "academicGrade" DOUBLE PRECISION,
ADD COLUMN     "attendanceRate" DOUBLE PRECISION,
ADD COLUMN     "criteriaFailed" JSONB,
ADD COLUMN     "detailedReason" TEXT,
ADD COLUMN     "disciplinaryCases" INTEGER,
ADD COLUMN     "outstandingBalance" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PromotionLog" DROP COLUMN "criteria",
ADD COLUMN     "appliedCriteriaId" TEXT,
ADD COLUMN     "attendanceRate" DOUBLE PRECISION,
ADD COLUMN     "averageGrade" DOUBLE PRECISION,
ADD COLUMN     "criteriaResults" JSONB NOT NULL,
ADD COLUMN     "disciplinaryCases" INTEGER,
ADD COLUMN     "fromGrade" TEXT NOT NULL,
ADD COLUMN     "manualOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "outstandingBalance" DOUBLE PRECISION,
ADD COLUMN     "overrideReason" TEXT,
ADD COLUMN     "toGrade" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ClassProgression_schoolId_fromGrade_toGrade_idx" ON "ClassProgression"("schoolId", "fromGrade", "toGrade");

-- CreateIndex
CREATE INDEX "PromotionCriteria_schoolId_classLevel_isActive_idx" ON "PromotionCriteria"("schoolId", "classLevel", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCriteria_schoolId_classLevel_name_key" ON "PromotionCriteria"("schoolId", "classLevel", "name");

-- CreateIndex
CREATE INDEX "PromotionExclusion_studentId_excludedAt_idx" ON "PromotionExclusion"("studentId", "excludedAt");

-- CreateIndex
CREATE INDEX "PromotionLog_studentId_promotionDate_idx" ON "PromotionLog"("studentId", "promotionDate");

-- CreateIndex
CREATE INDEX "PromotionLog_fromClass_toClass_promotionDate_idx" ON "PromotionLog"("fromClass", "toClass", "promotionDate");

-- AddForeignKey
ALTER TABLE "PromotionCriteria" ADD CONSTRAINT "PromotionCriteria_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassProgression" ADD CONSTRAINT "ClassProgression_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "PromotionCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassProgression" ADD CONSTRAINT "ClassProgression_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionLog" ADD CONSTRAINT "PromotionLog_appliedCriteriaId_fkey" FOREIGN KEY ("appliedCriteriaId") REFERENCES "PromotionCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
