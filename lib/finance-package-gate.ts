import { prisma } from '@/lib/prisma';

export const FINANCE_ALLOWED_PACKAGES = ['full', 'finance_only'] as const;

export type FinancePackageType = (typeof FINANCE_ALLOWED_PACKAGES)[number];

export function normalizePackageType(input: string | null | undefined): string {
  return (input || 'full').trim().toLowerCase();
}

/** Staff entry URL: finance-only schools use the finance login page, not the full admin portal shell. */
export function staffPortalLoginPath(schoolCode: string, packageType?: string | null): string {
  const code = String(schoolCode || '')
    .trim()
    .toLowerCase();
  if (!code) return '/schools';
  return normalizePackageType(packageType) === 'finance_only'
    ? `/schools/${code}/finance/login`
    : `/schools/${code}`;
}

export function isFinancePackageAllowed(packageType: string | null | undefined): boolean {
  return FINANCE_ALLOWED_PACKAGES.includes(
    normalizePackageType(packageType) as FinancePackageType
  );
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
    school,
  };
}
