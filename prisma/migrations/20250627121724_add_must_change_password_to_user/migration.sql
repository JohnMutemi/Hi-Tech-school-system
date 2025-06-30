-- AlterTable
ALTER TABLE "Parent" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SchoolAdmin" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
