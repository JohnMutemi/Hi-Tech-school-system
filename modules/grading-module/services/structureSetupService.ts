import { prisma } from '@/lib/prisma';

function parseDate(value: string | Date | undefined, fallback: Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

export async function createAcademicYear(
  schoolId: string,
  data: { name: string; startDate?: string | Date; endDate?: string | Date; isActive?: boolean }
) {
  const now = new Date();
  const yearStart = parseDate(data.startDate, new Date(now.getFullYear(), 0, 1));
  const yearEnd = parseDate(data.endDate, new Date(now.getFullYear(), 11, 31));

  if (data.isActive) {
    await prisma.gradingModAcademicYear.updateMany({
      where: { schoolId, isActive: true },
      data: { isActive: false },
    });
  }

  return prisma.gradingModAcademicYear.create({
    data: {
      schoolId,
      name: data.name.trim(),
      startDate: yearStart,
      endDate: yearEnd,
      isActive: Boolean(data.isActive),
    },
  });
}

export async function createTerm(
  schoolId: string,
  data: {
    academicYearId: string;
    name: string;
    startDate?: string | Date;
    endDate?: string | Date;
    weight?: number;
  }
) {
  const year = await prisma.gradingModAcademicYear.findFirst({
    where: { id: data.academicYearId, schoolId },
  });
  if (!year) throw new Error('Academic year not found');

  return prisma.gradingModTerm.create({
    data: {
      academicYearId: data.academicYearId,
      name: data.name.trim(),
      startDate: parseDate(data.startDate, year.startDate),
      endDate: parseDate(data.endDate, year.endDate),
      weight: data.weight ?? 0.333,
    },
  });
}

export async function createSubject(
  schoolId: string,
  data: { name: string; code: string; level?: string; isCore?: boolean }
) {
  return prisma.gradingModSubject.create({
    data: {
      schoolId,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      level: data.level?.trim() || 'upper_primary',
      isCore: data.isCore !== false,
    },
  });
}

export async function ensureGradingClassLegacyLink(classId: string, schoolId: string) {
  const gradingClass = await prisma.gradingModClass.findFirst({
    where: { id: classId, schoolId },
  });
  if (!gradingClass) return null;
  if (gradingClass.legacyClassId) return gradingClass.legacyClassId;

  const legacy = await ensureLegacyRosterClass(
    schoolId,
    gradingClass.name,
    gradingClass.gradeLevel
  );
  await prisma.gradingModClass.update({
    where: { id: classId },
    data: { legacyClassId: legacy.id },
  });
  return legacy.id;
}

export async function ensureLegacyRosterClass(
  schoolId: string,
  name: string,
  gradeLevel: string
) {
  const className = name.trim();
  const gradeName = gradeLevel.trim();

  const existing = await prisma.class.findFirst({
    where: { schoolId, name: className, isActive: true },
  });
  if (existing) return existing;

  let grade = await prisma.grade.findFirst({
    where: { schoolId, name: gradeName },
  });
  if (!grade) {
    grade = await prisma.grade.create({
      data: { schoolId, name: gradeName, isAlumni: false },
    });
  }

  return prisma.class.create({
    data: {
      schoolId,
      gradeId: grade.id,
      name: className,
      isActive: true,
    },
  });
}

export async function createGradingClass(
  schoolId: string,
  data: {
    name: string;
    gradeLevel: string;
    academicYearId?: string | null;
    gradingScaleId?: string | null;
    legacyClassId?: string | null;
  }
) {
  if (data.gradingScaleId) {
    const scale = await prisma.gradingModScale.findFirst({
      where: {
        id: data.gradingScaleId,
        OR: [{ schoolId }, { isSystemPreset: true }],
      },
    });
    if (!scale) throw new Error('Grading scale not found');
  }

  let legacyClassId = data.legacyClassId?.trim() || null;

  if (legacyClassId) {
    const legacy = await prisma.class.findFirst({
      where: { id: legacyClassId, schoolId },
    });
    if (!legacy) throw new Error('Legacy class not found for this school');
  } else {
    const legacy = await ensureLegacyRosterClass(schoolId, data.name, data.gradeLevel);
    legacyClassId = legacy.id;
  }

  return prisma.gradingModClass.create({
    data: {
      schoolId,
      name: data.name.trim(),
      gradeLevel: data.gradeLevel.trim(),
      academicYearId: data.academicYearId || null,
      gradingScaleId: data.gradingScaleId || null,
      legacyClassId,
    },
    include: {
      gradingScale: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      legacyClass: { select: { id: true, name: true } },
    },
  });
}

export async function createAssessmentType(
  schoolId: string,
  data: { name: string; weight: number; isFormative?: boolean }
) {
  return prisma.gradingModAssessmentType.create({
    data: {
      schoolId,
      name: data.name.trim(),
      weight: data.weight,
      isFormative: Boolean(data.isFormative),
    },
  });
}

export async function listLegacyClasses(schoolId: string) {
  return prisma.class.findMany({
    where: { schoolId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
