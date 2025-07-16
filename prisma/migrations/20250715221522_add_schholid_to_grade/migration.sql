/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `schoolId` to the `Grade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "academicYear",
DROP COLUMN "term";
