import type { GradingModBand } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { OverallResultPayload, SubjectResultPayload } from '../domain/types';

export function roundScore(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function scoreToBand(percentage: number, bands: GradingModBand[]): GradingModBand {
  const sorted = [...bands].sort((a, b) => b.minScore - a.minScore);
  const match = sorted.find(
    (band) => percentage >= band.minScore && percentage <= band.maxScore
  );
  return match ?? sorted[sorted.length - 1];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function assignCompetitionPositions<T extends { totalPoints: number }>(
  rows: T[]
): Array<T & { classPosition: number }> {
  const sorted = [...rows].sort((a, b) => b.totalPoints - a.totalPoints);
  let position = 0;
  let lastPoints: number | null = null;

  return sorted.map((row, index) => {
    if (lastPoints === null || row.totalPoints !== lastPoints) {
      position = index + 1;
      lastPoints = row.totalPoints;
    }
    return { ...row, classPosition: position };
  });
}

export async function computeSubjectResult(
  studentId: string,
  subjectId: string,
  termId: string,
  classId: string
): Promise<SubjectResultPayload | null> {
  const gradingClass = await prisma.gradingModClass.findUnique({
    where: { id: classId },
    include: {
      gradingScale: { include: { bands: true } },
    },
  });

  if (!gradingClass?.gradingScale) {
    throw new Error('Class has no grading scale assigned');
  }

  const assessments = await prisma.gradingModAssessment.findMany({
    where: { classId, subjectId, termId },
    include: {
      assessmentType: true,
      scores: { where: { studentId } },
    },
  });

  if (assessments.length === 0) {
    return null;
  }

  const typeGroups = new Map<string, { weight: number; percentages: number[] }>();

  for (const assessment of assessments) {
    const typeId = assessment.assessmentTypeId;
    const entry = typeGroups.get(typeId) ?? {
      weight: assessment.assessmentType.weight,
      percentages: [],
    };

    for (const score of assessment.scores) {
      if (score.rawScore == null || assessment.maxScore <= 0) continue;
      const pct = roundScore((score.rawScore / assessment.maxScore) * 100);
      entry.percentages.push(pct);
    }

    typeGroups.set(typeId, entry);
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const group of typeGroups.values()) {
    if (group.percentages.length === 0) continue;
    weightedTotal += mean(group.percentages) * group.weight;
    totalWeight += group.weight;
  }

  const finalPercentage = totalWeight > 0 ? roundScore(weightedTotal / totalWeight) : 0;
  const band = scoreToBand(finalPercentage, gradingClass.gradingScale.bands);

  const payload: SubjectResultPayload = {
    studentId,
    subjectId,
    termId,
    weightedScore: finalPercentage,
    bandId: band.id,
    points: band.points ?? null,
  };

  const existing = await prisma.gradingModSubjectResult.findUnique({
    where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
  });

  if (existing?.isPublished) {
    throw new Error('Published subject results cannot be overwritten without unlock');
  }

  await prisma.gradingModSubjectResult.upsert({
    where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
    create: {
      studentId,
      subjectId,
      termId,
      weightedScore: payload.weightedScore,
      bandId: payload.bandId,
      points: payload.points,
    },
    update: {
      weightedScore: payload.weightedScore,
      bandId: payload.bandId,
      points: payload.points,
      computedAt: new Date(),
    },
  });

  return payload;
}

async function resolveClassStudentIds(classId: string): Promise<string[]> {
  const gradingClass = await prisma.gradingModClass.findUnique({
    where: { id: classId },
    select: { legacyClassId: true },
  });

  if (!gradingClass) {
    throw new Error('Grading class not found');
  }

  const rosterClassId = gradingClass.legacyClassId ?? classId;
  const students = await prisma.student.findMany({
    where: { classId: rosterClassId, isActive: true },
    select: { id: true },
  });

  return students.map((s) => s.id);
}

export async function computeClassRankings(
  classId: string,
  termId: string
): Promise<OverallResultPayload[]> {
  const studentIds = await resolveClassStudentIds(classId);

  const subjectResults = await prisma.gradingModSubjectResult.findMany({
    where: { termId, studentId: { in: studentIds } },
    include: { band: true },
  });

  const gradingClass = await prisma.gradingModClass.findUnique({
    where: { id: classId },
    include: { gradingScale: { include: { bands: true } } },
  });

  const byStudent = new Map<string, typeof subjectResults>();
  for (const result of subjectResults) {
    const list = byStudent.get(result.studentId) ?? [];
    list.push(result);
    byStudent.set(result.studentId, list);
  }

  const overallRows = studentIds.map((studentId) => {
    const results = byStudent.get(studentId) ?? [];
    const points = results
      .map((r) => r.points)
      .filter((p): p is number => typeof p === 'number');
    const totalPoints = roundScore(points.reduce((sum, p) => sum + p, 0));
    const meanPoints = points.length > 0 ? roundScore(mean(points)) : 0;
    const meanBand =
      gradingClass?.gradingScale && points.length > 0
        ? scoreToBand(meanPoints, gradingClass.gradingScale.bands)
        : null;

    return {
      studentId,
      termId,
      classId,
      meanPoints,
      meanBandId: meanBand?.id ?? null,
      totalPoints,
      subjectsSat: results.length,
    };
  });

  const ranked = assignCompetitionPositions(overallRows);
  const classSize = ranked.length;

  const payloads: OverallResultPayload[] = [];

  for (const row of ranked) {
    const existing = await prisma.gradingModOverallResult.findUnique({
      where: { studentId_termId: { studentId: row.studentId, termId } },
    });

    if (existing?.isPublished) {
      continue;
    }

    await prisma.gradingModOverallResult.upsert({
      where: { studentId_termId: { studentId: row.studentId, termId } },
      create: {
        studentId: row.studentId,
        termId,
        classId,
        meanPoints: row.meanPoints,
        meanBandId: row.meanBandId,
        totalPoints: row.totalPoints,
        subjectsSat: row.subjectsSat,
        classPosition: row.classPosition,
        classSize,
      },
      update: {
        meanPoints: row.meanPoints,
        meanBandId: row.meanBandId,
        totalPoints: row.totalPoints,
        subjectsSat: row.subjectsSat,
        classPosition: row.classPosition,
        classSize,
        computedAt: new Date(),
      },
    });

    payloads.push({
      studentId: row.studentId,
      termId,
      classId,
      meanPoints: row.meanPoints,
      meanBandId: row.meanBandId,
      totalPoints: row.totalPoints,
      subjectsSat: row.subjectsSat,
      classPosition: row.classPosition,
      classSize,
    });
  }

  return payloads;
}

export async function computeTermResults(classId: string, termId: string): Promise<void> {
  const assessments = await prisma.gradingModAssessment.findMany({
    where: { classId, termId },
    select: { subjectId: true },
    distinct: ['subjectId'],
  });

  const studentIds = await resolveClassStudentIds(classId);

  for (const studentId of studentIds) {
    for (const { subjectId } of assessments) {
      await computeSubjectResult(studentId, subjectId, termId, classId);
    }
  }

  await computeClassRankings(classId, termId);
}
