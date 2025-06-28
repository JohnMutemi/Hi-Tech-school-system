/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,fromClass]` on the table `ClassProgression` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,classLevel]` on the table `PromotionCriteria` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClassProgression_schoolId_fromClass_key" ON "ClassProgression"("schoolId", "fromClass");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCriteria_schoolId_classLevel_key" ON "PromotionCriteria"("schoolId", "classLevel");
