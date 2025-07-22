/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `Payment` table. All the data in the column will be lost.
  - Made the column `academicYearId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `termId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_academicYearId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_termId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "academicYear",
DROP COLUMN "term",
ALTER COLUMN "academicYearId" SET NOT NULL,
ALTER COLUMN "termId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
