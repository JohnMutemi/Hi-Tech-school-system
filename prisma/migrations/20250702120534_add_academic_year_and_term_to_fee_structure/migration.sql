-- AlterTable
ALTER TABLE "TermlyFeeStructure" ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "termId" TEXT;

-- AddForeignKey
ALTER TABLE "TermlyFeeStructure" ADD CONSTRAINT "TermlyFeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermlyFeeStructure" ADD CONSTRAINT "TermlyFeeStructure_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
