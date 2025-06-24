-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "classSection" TEXT,
ADD COLUMN     "dateAdmitted" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "medicalInfo" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "TermlyFeeStructure" ADD COLUMN     "className" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "isReleased" BOOLEAN NOT NULL DEFAULT false;
