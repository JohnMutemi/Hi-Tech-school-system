-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "isAlumni" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StudentYearlyBalance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCharged" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCarriedForward" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentYearlyBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentYearlyBalance_studentId_academicYear_key" ON "StudentYearlyBalance"("studentId", "academicYear");

-- AddForeignKey
ALTER TABLE "StudentYearlyBalance" ADD CONSTRAINT "StudentYearlyBalance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
