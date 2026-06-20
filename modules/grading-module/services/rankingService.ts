import { prisma } from '@/lib/prisma';

export async function getClassRankings(classId: string, termId: string, schoolId: string) {
  const gradingClass = await prisma.gradingModClass.findFirst({
    where: { id: classId, schoolId },
    include: { gradingScale: { include: { bands: true } } },
  });

  if (!gradingClass) {
    throw new Error('Class not found');
  }

  const legacyClassId = gradingClass.legacyClassId ?? classId;
  const students = await prisma.student.findMany({
    where: { classId: legacyClassId, schoolId, isActive: true },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: 'asc' } },
  });

  const studentIds = students.map((s) => s.id);

  const [overallResults, subjectResults, subjects] = await Promise.all([
    prisma.gradingModOverallResult.findMany({
      where: { classId, termId, studentId: { in: studentIds } },
      include: { meanBand: true },
    }),
    prisma.gradingModSubjectResult.findMany({
      where: { termId, studentId: { in: studentIds } },
      include: { band: true, subject: true },
    }),
    prisma.gradingModSubject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } }),
  ]);

  const overallMap = new Map(overallResults.map((r) => [r.studentId, r]));
  const subjectMap = new Map<string, typeof subjectResults>();
  for (const result of subjectResults) {
    const list = subjectMap.get(result.studentId) ?? [];
    list.push(result);
    subjectMap.set(result.studentId, list);
  }

  const rows = students.map((student) => {
    const overall = overallMap.get(student.id);
    const subjectRows = subjectMap.get(student.id) ?? [];
    return {
      studentId: student.id,
      name: student.user.name,
      admissionNumber: student.admissionNumber,
      classPosition: overall?.classPosition ?? null,
      totalPoints: overall?.totalPoints ?? null,
      meanPoints: overall?.meanPoints ?? null,
      meanBand: overall?.meanBand
        ? {
            code: overall.meanBand.code,
            label: overall.meanBand.label,
            colorHex: overall.meanBand.colorHex,
          }
        : null,
      subjects: subjectRows.map((sr) => ({
        subjectId: sr.subjectId,
        subjectName: sr.subject.name,
        weightedScore: sr.weightedScore,
        points: sr.points,
        band: sr.band
          ? { code: sr.band.code, label: sr.band.label, colorHex: sr.band.colorHex }
          : null,
      })),
    };
  });

  rows.sort((a, b) => {
    const posA = a.classPosition ?? 9999;
    const posB = b.classPosition ?? 9999;
    return posA - posB;
  });

  return {
    class: {
      id: gradingClass.id,
      name: gradingClass.name,
      gradeLevel: gradingClass.gradeLevel,
    },
    termId,
    classSize: rows.length,
    subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    rankings: rows,
  };
}

export async function getClassAnalyticsSummary(classId: string, termId: string, schoolId: string) {
  const data = await getClassRankings(classId, termId, schoolId);
  const bandDistribution: Record<string, number> = {};

  for (const row of data.rankings) {
    const code = row.meanBand?.code ?? 'N/A';
    bandDistribution[code] = (bandDistribution[code] ?? 0) + 1;
  }

  const scores = data.rankings
    .map((r) => r.meanPoints)
    .filter((v): v is number => typeof v === 'number');
  const classMean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return {
    classSize: data.classSize,
    classMean: Math.round(classMean * 100) / 100,
    bandDistribution,
    topThree: data.rankings.filter((r) => r.classPosition != null && r.classPosition <= 3),
  };
}
