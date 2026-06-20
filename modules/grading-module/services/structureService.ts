import { prisma } from '@/lib/prisma';
import { ensureGradingClassLegacyLink } from './structureSetupService';

export async function listGradingClasses(schoolId: string) {
  const classes = await prisma.gradingModClass.findMany({
    where: { schoolId },
    include: {
      gradingScale: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      legacyClass: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const needsRefresh = classes.some((gradingClass) => !gradingClass.legacyClassId);
  if (needsRefresh) {
    for (const gradingClass of classes) {
      if (!gradingClass.legacyClassId) {
        await ensureGradingClassLegacyLink(gradingClass.id, schoolId);
      }
    }
    return prisma.gradingModClass.findMany({
      where: { schoolId },
      include: {
        gradingScale: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        legacyClass: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  return classes;
}

export async function listGradingSubjects(schoolId: string) {
  return prisma.gradingModSubject.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
  });
}

export async function listGradingTerms(schoolId: string) {
  return prisma.gradingModTerm.findMany({
    where: { academicYear: { schoolId } },
    include: { academicYear: { select: { id: true, name: true } } },
    orderBy: [{ academicYear: { name: 'desc' } }, { name: 'asc' }],
  });
}

export async function listAssessmentTypes(schoolId: string) {
  return prisma.gradingModAssessmentType.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
  });
}

export async function listAcademicYears(schoolId: string) {
  return prisma.gradingModAcademicYear.findMany({
    where: { schoolId },
    orderBy: { name: 'desc' },
  });
}

export async function getGradingStructure(schoolId: string) {
  const [classes, subjects, terms, assessmentTypes, academicYears, scales] = await Promise.all([
    listGradingClasses(schoolId),
    listGradingSubjects(schoolId),
    listGradingTerms(schoolId),
    listAssessmentTypes(schoolId),
    listAcademicYears(schoolId),
    prisma.gradingModScale.findMany({
      where: { OR: [{ schoolId }, { isSystemPreset: true }] },
      include: { bands: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    }),
  ]);

  return { classes, subjects, terms, assessmentTypes, academicYears, scales };
}
