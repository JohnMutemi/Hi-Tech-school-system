-- AlterTable
ALTER TABLE "School" ADD COLUMN     "admissionNumberAutoIncrement" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "admissionNumberFormat" TEXT,
ADD COLUMN     "lastAdmissionNumber" TEXT;
