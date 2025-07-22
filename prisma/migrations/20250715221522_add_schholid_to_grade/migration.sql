/*
  Warnings:
  - Added the required column `schoolId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - This migration was manually fixed to avoid dropping non-existent columns from Payment.
*/
-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- NOTE: Dropping columns from Payment was skipped due to schema mismatch.
