/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Class` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId,name]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Class" DROP COLUMN "academicYear";

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_name_key" ON "Class"("schoolId", "name");
