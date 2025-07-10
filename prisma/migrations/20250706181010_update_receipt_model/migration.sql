/*
  Warnings:

  - You are about to drop the column `balance` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `balanceBefore` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `balanceCarriedForward` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `Receipt` table. All the data in the column will be lost.
  - Added the required column `academicYearOutstandingAfter` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearOutstandingBefore` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "balance",
DROP COLUMN "balanceBefore",
DROP COLUMN "balanceCarriedForward",
DROP COLUMN "format",
ADD COLUMN     "academicYearOutstandingAfter" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "academicYearOutstandingBefore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "termOutstandingAfter" DOUBLE PRECISION,
ADD COLUMN     "termOutstandingBefore" DOUBLE PRECISION;
