-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('exam', 'test', 'assignment', 'quiz', 'practical');

-- CreateEnum
CREATE TYPE "GradeResultStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "GradingCriteria" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "passMark" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "scaleBands" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdByTeacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'test',
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "dueDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentScore" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGradeResult" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "totalWeighted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "letterGrade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION,
    "passStatus" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "status" "GradeResultStatus" NOT NULL DEFAULT 'draft',
    "gradedByTeacherId" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGradeResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingCriteria_schoolId_isActive_idx" ON "GradingCriteria"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "Assessment_schoolId_classId_subjectId_term_idx" ON "Assessment"("schoolId", "classId", "subjectId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScore_assessmentId_studentId_key" ON "StudentScore"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "StudentScore_studentId_idx" ON "StudentScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGradeResult_studentId_subjectId_term_academicYear_key" ON "StudentGradeResult"("studentId", "subjectId", "term", "academicYear");

-- CreateIndex
CREATE INDEX "StudentGradeResult_schoolId_term_academicYear_idx" ON "StudentGradeResult"("schoolId", "term", "academicYear");

-- CreateIndex
CREATE INDEX "StudentGradeResult_classId_subjectId_idx" ON "StudentGradeResult"("classId", "subjectId");

-- AddForeignKey
ALTER TABLE "GradingCriteria" ADD CONSTRAINT "GradingCriteria_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdByTeacherId_fkey" FOREIGN KEY ("createdByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGradeResult" ADD CONSTRAINT "StudentGradeResult_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGradeResult" ADD CONSTRAINT "StudentGradeResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGradeResult" ADD CONSTRAINT "StudentGradeResult_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGradeResult" ADD CONSTRAINT "StudentGradeResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGradeResult" ADD CONSTRAINT "StudentGradeResult_gradedByTeacherId_fkey" FOREIGN KEY ("gradedByTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
