/*
  Warnings:

  - You are about to drop the column `mustChangePassword` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `mustChangePassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Parent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SchoolAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Teacher` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `academicYear` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_resetToken_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "academicYear" INTEGER NOT NULL,
ADD COLUMN     "term" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "mustChangePassword",
DROP COLUMN "password",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "mustChangePassword";

-- DropTable
DROP TABLE "Parent";

-- DropTable
DROP TABLE "SchoolAdmin";

-- DropTable
DROP TABLE "Teacher";
