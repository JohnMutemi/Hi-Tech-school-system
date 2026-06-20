import { prisma } from '@/lib/prisma';
import { computeTermResults } from './gradingEngine';
import { createAssessment } from './scoreEntryService';
import { upsertAssessmentScores } from './scoreEntryService';
import { getClassRankings } from './rankingService';
import { listLegacyRosterStudents } from './rosterService';

const PERFORMANCE_ASSESSMENT_NAME = 'Performance Review';

async function resolveLegacyClassId(gradingClassId: string, schoolId: string): Promise<string> {
  const gradingClass = await prisma.gradingModClass.findFirst({
    where: { id: gradingClassId, schoolId },
    select: { legacyClassId: true },
  });
  if (!gradingClass?.legacyClassId) {
    throw new Error('Grading class must be linked to a legacy roster class');
  }
  return gradingClass.legacyClassId;
}

async function ensurePerformanceAssessmentType(schoolId: string) {
  const existing = await prisma.gradingModAssessmentType.findFirst({
    where: { schoolId, name: PERFORMANCE_ASSESSMENT_NAME },
  });
  if (existing) return existing;

  return prisma.gradingModAssessmentType.create({
    data: {
      schoolId,
      name: PERFORMANCE_ASSESSMENT_NAME,
      weight: 100,
      isFormative: false,
    },
  });
}

async function ensureSubjectAssessment(
  schoolId: string,
  classId: string,
  subjectId: string,
  termId: string,
  assessmentTypeId: string,
  enteredBy?: string
) {
  const existing = await prisma.gradingModAssessment.findFirst({
    where: {
      schoolId,
      classId,
      subjectId,
      termId,
      name: PERFORMANCE_ASSESSMENT_NAME,
    },
  });
  if (existing) return existing;

  return createAssessment(schoolId, {
    classId,
    subjectId,
    termId,
    assessmentTypeId,
    name: PERFORMANCE_ASSESSMENT_NAME,
    maxScore: 100,
    createdBy: enteredBy,
  });
}

export async function getPerformanceReviewBoard(
  schoolId: string,
  classId: string,
  termId: string
) {
  const legacyClassId = await resolveLegacyClassId(classId, schoolId);
  const [{ students }, subjects, rankingsPayload] = await Promise.all([
    listLegacyRosterStudents(schoolId, legacyClassId),
    prisma.gradingModSubject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    }),
    getClassRankings(classId, termId, schoolId).catch(() => null),
  ]);

  const assessments = await prisma.gradingModAssessment.findMany({
    where: { schoolId, classId, termId, name: PERFORMANCE_ASSESSMENT_NAME },
    include: {
      scores: true,
      subject: { select: { id: true, name: true, code: true } },
    },
  });

  const assessmentBySubject = new Map(assessments.map((a) => [a.subjectId, a]));
  const rankingMap = new Map(
    (rankingsPayload?.rankings ?? []).map((row) => [row.studentId, row])
  );

  const rows = students.map((student) => {
    const ranking = rankingMap.get(student.id);
    const subjectScores = subjects.map((subject) => {
      const assessment = assessmentBySubject.get(subject.id);
      const score = assessment?.scores.find((s) => s.studentId === student.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        assessmentId: assessment?.id ?? null,
        rawScore: score?.rawScore ?? null,
        percentage: score?.percentage ?? null,
      };
    });

    return {
      studentId: student.id,
      name: student.user.name,
      admissionNumber: student.admissionNumber,
      classPosition: ranking?.classPosition ?? null,
      totalPoints: ranking?.totalPoints ?? null,
      meanPoints: ranking?.meanPoints ?? null,
      meanBand: ranking?.meanBand ?? null,
      subjectScores,
    };
  });

  rows.sort((a, b) => {
    const posA = a.classPosition ?? 9999;
    const posB = b.classPosition ?? 9999;
    return posA - posB;
  });

  return {
    legacyClassId,
    subjects,
    rows,
    rankingsComputed: Boolean(rankingsPayload?.rankings?.length),
  };
}

export async function savePerformanceReviewScores(
  schoolId: string,
  classId: string,
  termId: string,
  entries: Array<{ studentId: string; subjectId: string; rawScore: number | null }>,
  enteredBy?: string
) {
  if (entries.length === 0) {
    throw new Error('No score entries provided');
  }

  await resolveLegacyClassId(classId, schoolId);
  const assessmentType = await ensurePerformanceAssessmentType(schoolId);

  const bySubject = new Map<string, Array<{ studentId: string; rawScore: number | null }>>();
  for (const entry of entries) {
    const list = bySubject.get(entry.subjectId) ?? [];
    list.push({ studentId: entry.studentId, rawScore: entry.rawScore });
    bySubject.set(entry.subjectId, list);
  }

  let saved = 0;
  for (const [subjectId, subjectEntries] of bySubject) {
    const assessment = await ensureSubjectAssessment(
      schoolId,
      classId,
      subjectId,
      termId,
      assessmentType.id,
      enteredBy
    );
    await upsertAssessmentScores(assessment.id, schoolId, subjectEntries, enteredBy);
    saved += subjectEntries.length;
  }

  await computeTermResults(classId, termId);
  const board = await getPerformanceReviewBoard(schoolId, classId, termId);

  return { saved, board };
}
