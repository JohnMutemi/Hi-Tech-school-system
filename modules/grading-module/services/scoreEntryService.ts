import { prisma } from '@/lib/prisma';
import { ensureGradingClassLegacyLink } from './structureSetupService';
import { roundScore, scoreToBand } from './gradingEngine';

async function resolveRosterStudentIds(classId: string): Promise<string[]> {
  const gradingClass = await prisma.gradingModClass.findUnique({
    where: { id: classId },
    select: { legacyClassId: true, schoolId: true },
  });
  if (!gradingClass) return [];

  const rosterClassId =
    gradingClass.legacyClassId ??
    (await ensureGradingClassLegacyLink(classId, gradingClass.schoolId)) ??
    classId;
  const students = await prisma.student.findMany({
    where: { classId: rosterClassId, schoolId: gradingClass.schoolId, isActive: true },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: 'asc' } },
  });
  return students.map((s) => s.id);
}

export async function listAssessments(
  schoolId: string,
  filters: { classId?: string; subjectId?: string; termId?: string }
) {
  return prisma.gradingModAssessment.findMany({
    where: {
      schoolId,
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.termId ? { termId: filters.termId } : {}),
    },
    include: {
      assessmentType: true,
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAssessment(
  schoolId: string,
  data: {
    classId: string;
    subjectId: string;
    termId: string;
    assessmentTypeId: string;
    name: string;
    maxScore?: number;
    dateAdministered?: Date | null;
    createdBy?: string;
  }
) {
  return prisma.gradingModAssessment.create({
    data: {
      schoolId,
      classId: data.classId,
      subjectId: data.subjectId,
      termId: data.termId,
      assessmentTypeId: data.assessmentTypeId,
      name: data.name,
      maxScore: data.maxScore ?? 100,
      dateAdministered: data.dateAdministered ?? null,
      createdBy: data.createdBy,
    },
    include: { assessmentType: true },
  });
}

export async function getAssessmentScoreSheet(assessmentId: string, schoolId: string) {
  const assessment = await prisma.gradingModAssessment.findFirst({
    where: { id: assessmentId, schoolId },
    include: {
      class: {
        include: {
          gradingScale: { include: { bands: true } },
        },
      },
      subject: true,
      term: true,
      assessmentType: true,
      scores: true,
    },
  });

  if (!assessment) return null;

  const studentIds = await resolveRosterStudentIds(assessment.classId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: 'asc' } },
  });

  const scoreMap = new Map(assessment.scores.map((s) => [s.studentId, s]));
  const bands = assessment.class.gradingScale?.bands ?? [];

  const rows = students.map((student) => {
    const score = scoreMap.get(student.id);
    const rawScore = score?.rawScore ?? null;
    const percentage =
      rawScore != null && assessment.maxScore > 0
        ? roundScore((rawScore / assessment.maxScore) * 100)
        : null;
    const band =
      percentage != null && bands.length > 0 ? scoreToBand(percentage, bands) : null;

    return {
      studentId: student.id,
      name: student.user.name,
      admissionNumber: student.admissionNumber,
      rawScore,
      percentage,
      band: band
        ? { id: band.id, code: band.code, label: band.label, colorHex: band.colorHex }
        : null,
      remarks: score?.remarks ?? '',
    };
  });

  return {
    assessment: {
      id: assessment.id,
      name: assessment.name,
      maxScore: assessment.maxScore,
      classId: assessment.classId,
      subjectId: assessment.subjectId,
      termId: assessment.termId,
      assessmentType: assessment.assessmentType.name,
    },
    bands: bands.map((band) => ({
      id: band.id,
      code: band.code,
      label: band.label,
      colorHex: band.colorHex,
      minScore: band.minScore,
      maxScore: band.maxScore,
    })),
    students: rows,
  };
}

export async function upsertAssessmentScores(
  assessmentId: string,
  schoolId: string,
  entries: Array<{ studentId: string; rawScore: number | null; remarks?: string }>,
  enteredBy?: string
) {
  const assessment = await prisma.gradingModAssessment.findFirst({
    where: { id: assessmentId, schoolId },
    include: {
      class: { include: { gradingScale: { include: { bands: true } } } },
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const allowedIds = new Set(await resolveRosterStudentIds(assessment.classId));
  const bands = assessment.class.gradingScale?.bands ?? [];

  for (const entry of entries) {
    if (!allowedIds.has(entry.studentId)) {
      throw new Error(`Invalid student in score payload: ${entry.studentId}`);
    }

    if (entry.rawScore != null) {
      if (entry.rawScore < 0 || entry.rawScore > assessment.maxScore) {
        throw new Error(`Score out of bounds for student ${entry.studentId}`);
      }
    }
  }

  for (const entry of entries) {
    const percentage =
      entry.rawScore != null && assessment.maxScore > 0
        ? roundScore((entry.rawScore / assessment.maxScore) * 100)
        : null;
    const band =
      percentage != null && bands.length > 0 ? scoreToBand(percentage, bands) : null;

    await prisma.gradingModScore.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId: entry.studentId,
        },
      },
      create: {
        assessmentId,
        studentId: entry.studentId,
        rawScore: entry.rawScore,
        percentage,
        bandId: band?.id ?? null,
        remarks: entry.remarks ?? null,
        enteredBy,
      },
      update: {
        rawScore: entry.rawScore,
        percentage,
        bandId: band?.id ?? null,
        remarks: entry.remarks ?? null,
        enteredBy,
      },
    });
  }

  return { count: entries.length };
}
