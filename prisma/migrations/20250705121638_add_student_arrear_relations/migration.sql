-- CreateTable
CREATE TABLE "StudentArrear" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "arrearAmount" DOUBLE PRECISION NOT NULL,
    "dateRecorded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "StudentArrear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentArrear_studentId_academicYearId_idx" ON "StudentArrear"("studentId", "academicYearId");

-- AddForeignKey
ALTER TABLE "StudentArrear" ADD CONSTRAINT "StudentArrear_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentArrear" ADD CONSTRAINT "StudentArrear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentArrear" ADD CONSTRAINT "StudentArrear_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
