-- CreateTable
CREATE TABLE "Alumni" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "graduationYear" TEXT NOT NULL,
    "finalGrade" TEXT NOT NULL,
    "achievements" JSONB,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "currentInstitution" TEXT,
    "currentOccupation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alumni_schoolId_graduationYear_idx" ON "Alumni"("schoolId", "graduationYear");

-- CreateIndex
CREATE INDEX "Alumni_graduationYear_finalGrade_idx" ON "Alumni"("graduationYear", "finalGrade");

-- CreateIndex
CREATE UNIQUE INDEX "Alumni_studentId_graduationYear_key" ON "Alumni"("studentId", "graduationYear");

-- AddForeignKey
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
