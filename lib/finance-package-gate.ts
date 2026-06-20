import { prisma } from '@/lib/prisma';
import {
  hasFinanceModule,
  normalizePackageType,
  type SchoolPackageType,
} from '@/lib/school-package';
import { financePortalLoginPath } from '@/lib/staff-portal-path';

export const FINANCE_ALLOWED_PACKAGES = ['full', 'finance_only', 'finance_grading'] as const;

export type FinancePackageType = (typeof FINANCE_ALLOWED_PACKAGES)[number];

export { normalizePackageType };

/** Staff entry URL for finance-only schools. */
export function staffPortalLoginPath(schoolCode: string, packageType?: string | null): string {
  const code = String(schoolCode || '').trim().toLowerCase();
  if (!code) return '/schools';
  return normalizePackageType(packageType) === 'finance_only'
    ? financePortalLoginPath(code)
    : `/schools/${code}`;
}

export function isFinancePackageAllowed(packageType: string | null | undefined): boolean {
  return hasFinanceModule(packageType);
}

export async function resolveFinanceGateForSchoolCode(schoolCode: string) {
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

  if (!isFinancePackageAllowed(school.packageType)) {
    return {
      ok: false as const,
      status: 403,
      error: 'Finance module is not enabled for this school package',
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
