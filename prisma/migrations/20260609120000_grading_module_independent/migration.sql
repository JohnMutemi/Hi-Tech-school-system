-- Independent Grading Module (grading_mod_* tables)
-- Does not alter legacy grading tables (GradingCriteria, Assessment, StudentScore).

CREATE TABLE "grading_mod_scales" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystemPreset" BOOLEAN NOT NULL DEFAULT false,
    "presetKey" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_scales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_bands" (
    "id" TEXT NOT NULL,
    "scaleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "points" DOUBLE PRECISION,
    "colorHex" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "grading_mod_bands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_academic_years" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_academic_years_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_terms" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.333,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_subjects" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_classes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "academicYearId" TEXT,
    "gradingScaleId" TEXT,
    "legacyClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_classes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_assessment_types" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "isFormative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_assessment_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_assessments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "assessmentTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "dateAdministered" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_scores" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "bandId" TEXT,
    "remarks" TEXT,
    "enteredBy" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_competency_ratings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "competencyName" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "teacherComment" TEXT,
    "ratedBy" TEXT,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grading_mod_competency_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_subject_results" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "weightedScore" DOUBLE PRECISION,
    "bandId" TEXT,
    "points" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_subject_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_overall_results" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "meanPoints" DOUBLE PRECISION,
    "meanBandId" TEXT,
    "totalPoints" DOUBLE PRECISION,
    "subjectsSat" INTEGER,
    "classPosition" INTEGER,
    "streamPosition" INTEGER,
    "gradePosition" INTEGER,
    "classSize" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_mod_overall_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_report_cards" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'default',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,

    CONSTRAINT "grading_mod_report_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grading_mod_report_comments" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "authorId" TEXT,
    "role" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grading_mod_report_comments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grading_mod_bands_scaleId_code_key" ON "grading_mod_bands"("scaleId", "code");
CREATE INDEX "grading_mod_scales_schoolId_isDefault_idx" ON "grading_mod_scales"("schoolId", "isDefault");
CREATE INDEX "grading_mod_scales_isSystemPreset_presetKey_idx" ON "grading_mod_scales"("isSystemPreset", "presetKey");
CREATE UNIQUE INDEX "grading_mod_academic_years_schoolId_name_key" ON "grading_mod_academic_years"("schoolId", "name");
CREATE UNIQUE INDEX "grading_mod_terms_academicYearId_name_key" ON "grading_mod_terms"("academicYearId", "name");
CREATE UNIQUE INDEX "grading_mod_subjects_schoolId_code_key" ON "grading_mod_subjects"("schoolId", "code");
CREATE UNIQUE INDEX "grading_mod_classes_schoolId_name_key" ON "grading_mod_classes"("schoolId", "name");
CREATE UNIQUE INDEX "grading_mod_assessment_types_schoolId_name_key" ON "grading_mod_assessment_types"("schoolId", "name");
CREATE INDEX "grading_mod_assessments_schoolId_classId_subjectId_termId_idx" ON "grading_mod_assessments"("schoolId", "classId", "subjectId", "termId");
CREATE UNIQUE INDEX "grading_mod_scores_assessmentId_studentId_key" ON "grading_mod_scores"("assessmentId", "studentId");
CREATE INDEX "grading_mod_scores_studentId_idx" ON "grading_mod_scores"("studentId");
CREATE INDEX "grading_mod_competency_ratings_studentId_subjectId_termId_idx" ON "grading_mod_competency_ratings"("studentId", "subjectId", "termId");
CREATE UNIQUE INDEX "grading_mod_subject_results_studentId_subjectId_termId_key" ON "grading_mod_subject_results"("studentId", "subjectId", "termId");
CREATE UNIQUE INDEX "grading_mod_overall_results_studentId_termId_key" ON "grading_mod_overall_results"("studentId", "termId");
CREATE INDEX "grading_mod_overall_results_classId_termId_idx" ON "grading_mod_overall_results"("classId", "termId");
CREATE INDEX "grading_mod_report_cards_studentId_termId_idx" ON "grading_mod_report_cards"("studentId", "termId");

ALTER TABLE "grading_mod_scales" ADD CONSTRAINT "grading_mod_scales_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_scales" ADD CONSTRAINT "grading_mod_scales_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_bands" ADD CONSTRAINT "grading_mod_bands_scaleId_fkey" FOREIGN KEY ("scaleId") REFERENCES "grading_mod_scales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grading_mod_academic_years" ADD CONSTRAINT "grading_mod_academic_years_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_terms" ADD CONSTRAINT "grading_mod_terms_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "grading_mod_academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grading_mod_subjects" ADD CONSTRAINT "grading_mod_subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_classes" ADD CONSTRAINT "grading_mod_classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_classes" ADD CONSTRAINT "grading_mod_classes_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "grading_mod_academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_classes" ADD CONSTRAINT "grading_mod_classes_gradingScaleId_fkey" FOREIGN KEY ("gradingScaleId") REFERENCES "grading_mod_scales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_classes" ADD CONSTRAINT "grading_mod_classes_legacyClassId_fkey" FOREIGN KEY ("legacyClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessment_types" ADD CONSTRAINT "grading_mod_assessment_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessments" ADD CONSTRAINT "grading_mod_assessments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessments" ADD CONSTRAINT "grading_mod_assessments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "grading_mod_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessments" ADD CONSTRAINT "grading_mod_assessments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "grading_mod_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessments" ADD CONSTRAINT "grading_mod_assessments_termId_fkey" FOREIGN KEY ("termId") REFERENCES "grading_mod_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessments" ADD CONSTRAINT "grading_mod_assessments_assessmentTypeId_fkey" FOREIGN KEY ("assessmentTypeId") REFERENCES "grading_mod_assessment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_assessments" ADD CONSTRAINT "grading_mod_assessments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_scores" ADD CONSTRAINT "grading_mod_scores_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "grading_mod_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grading_mod_scores" ADD CONSTRAINT "grading_mod_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_scores" ADD CONSTRAINT "grading_mod_scores_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "grading_mod_bands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_scores" ADD CONSTRAINT "grading_mod_scores_enteredBy_fkey" FOREIGN KEY ("enteredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_competency_ratings" ADD CONSTRAINT "grading_mod_competency_ratings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_competency_ratings" ADD CONSTRAINT "grading_mod_competency_ratings_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "grading_mod_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_competency_ratings" ADD CONSTRAINT "grading_mod_competency_ratings_termId_fkey" FOREIGN KEY ("termId") REFERENCES "grading_mod_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_competency_ratings" ADD CONSTRAINT "grading_mod_competency_ratings_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "grading_mod_bands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_competency_ratings" ADD CONSTRAINT "grading_mod_competency_ratings_ratedBy_fkey" FOREIGN KEY ("ratedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_subject_results" ADD CONSTRAINT "grading_mod_subject_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_subject_results" ADD CONSTRAINT "grading_mod_subject_results_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "grading_mod_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_subject_results" ADD CONSTRAINT "grading_mod_subject_results_termId_fkey" FOREIGN KEY ("termId") REFERENCES "grading_mod_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_subject_results" ADD CONSTRAINT "grading_mod_subject_results_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "grading_mod_bands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_overall_results" ADD CONSTRAINT "grading_mod_overall_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_overall_results" ADD CONSTRAINT "grading_mod_overall_results_termId_fkey" FOREIGN KEY ("termId") REFERENCES "grading_mod_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_overall_results" ADD CONSTRAINT "grading_mod_overall_results_classId_fkey" FOREIGN KEY ("classId") REFERENCES "grading_mod_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_overall_results" ADD CONSTRAINT "grading_mod_overall_results_meanBandId_fkey" FOREIGN KEY ("meanBandId") REFERENCES "grading_mod_bands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_report_cards" ADD CONSTRAINT "grading_mod_report_cards_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_report_cards" ADD CONSTRAINT "grading_mod_report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_report_cards" ADD CONSTRAINT "grading_mod_report_cards_termId_fkey" FOREIGN KEY ("termId") REFERENCES "grading_mod_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grading_mod_report_cards" ADD CONSTRAINT "grading_mod_report_cards_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grading_mod_report_comments" ADD CONSTRAINT "grading_mod_report_comments_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "grading_mod_report_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grading_mod_report_comments" ADD CONSTRAINT "grading_mod_report_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
