import { prisma } from '@/lib/prisma';
import {
  hasGradingModule,
  normalizePackageType,
  type SchoolPackageType,
} from '@/lib/school-package';
import { academicsPortalLoginPath } from '@/lib/staff-portal-path';

export const GRADING_ALLOWED_PACKAGES = ['full', 'grading_only', 'finance_grading'] as const;

export type GradingPackageType = (typeof GRADING_ALLOWED_PACKAGES)[number];

export { normalizePackageType };

export function isGradingPackageAllowed(packageType: string | null | undefined): boolean {
  return hasGradingModule(packageType);
}

export function staffPortalLoginPath(schoolCode: string, packageType?: string | null): string {
  const code = String(schoolCode || '').trim().toLowerCase();
  if (!code) return '/schools';
  return normalizePackageType(packageType) === 'grading_only'
    ? academicsPortalLoginPath(code)
    : `/schools/${code}`;
}

export async function resolveGradingGateForSchoolCode(schoolCode: string) {
  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: 'insensitive' } },
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      packageType: true,
    },
  });

  if (!school) {
    return {
      ok: false as const,
      status: 404,
      error: 'School not found',
    };
  }

  if (!school.isActive) {
    return {
      ok: false as const,
      status: 403,
      error: 'School account is inactive',
    };
  }

  if (!isGradingPackageAllowed(school.packageType)) {
    return {
      ok: false as const,
      status: 403,
      error: 'Grading module is not enabled for this school package',
    };
  }

  return {
    ok: true as const,
    school: {
      ...school,
      packageType: normalizePackageType(school.packageType) as SchoolPackageType,
    },
  };
}
