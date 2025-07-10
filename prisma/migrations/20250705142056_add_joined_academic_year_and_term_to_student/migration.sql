-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "joinedAcademicYearId" TEXT,
ADD COLUMN     "joinedTermId" TEXT;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_joinedAcademicYearId_fkey" FOREIGN KEY ("joinedAcademicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_joinedTermId_fkey" FOREIGN KEY ("joinedTermId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
