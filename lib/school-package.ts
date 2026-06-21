/**
 * School subscription packages controlled by superadmin.
 *
 * - full: entire Hi-Tech SMS platform
 * - finance_only: standalone finance / bursary workspace
 * - grading_only: standalone academics & grading workspace
 * - finance_grading: both standalone modules (two login shells)
 */

export const SCHOOL_PACKAGE_TYPES = [
  'full',
  'finance_only',
  'grading_only',
  'finance_grading',
] as const;

export type SchoolPackageType = (typeof SCHOOL_PACKAGE_TYPES)[number];

export const PACKAGE_LABELS: Record<SchoolPackageType, string> = {
  full: 'Full Package',
  finance_only: 'Finance Module',
  grading_only: 'Academics & Grading Module',
  finance_grading: 'Finance + Academics Modules',
};

export const FINANCE_PORTAL_LABEL = 'Finance Workspace';
export const ACADEMICS_PORTAL_LABEL = 'Academics & Grading Workspace';

export function normalizePackageType(input: string | null | undefined): SchoolPackageType {
  const normalized = (input || 'full').trim().toLowerCase();
  if (SCHOOL_PACKAGE_TYPES.includes(normalized as SchoolPackageType)) {
    return normalized as SchoolPackageType;
  }
  return 'full';
}

export function getPackageLabel(packageType: string | null | undefined): string {
  const pkg = normalizePackageType(packageType);
  return PACKAGE_LABELS[pkg];
}

export function hasFinanceModule(packageType: string | null | undefined): boolean {
  const pkg = normalizePackageType(packageType);
  return pkg === 'full' || pkg === 'finance_only' || pkg === 'finance_grading';
}

export function hasGradingModule(packageType: string | null | undefined): boolean {
  const pkg = normalizePackageType(packageType);
  return pkg === 'full' || pkg === 'grading_only' || pkg === 'finance_grading';
}

export function hasFullAdminPortal(packageType: string | null | undefined): boolean {
  return normalizePackageType(packageType) === 'full';
}

export function isDualModulePackage(packageType: string | null | undefined): boolean {
  return normalizePackageType(packageType) === 'finance_grading';
}

export function isStandaloneFinancePackage(packageType: string | null | undefined): boolean {
  return normalizePackageType(packageType) === 'finance_only';
}

export function isStandaloneGradingPackage(packageType: string | null | undefined): boolean {
  return normalizePackageType(packageType) === 'grading_only';
}

/** Human-readable module chips for superadmin & onboarding UI. */
export function getSubscribedModuleChips(packageType: string | null | undefined): string[] {
  const pkg = normalizePackageType(packageType);
  const chips: string[] = [];
  if (hasFullAdminPortal(pkg)) chips.push('Admin');
  if (hasFinanceModule(pkg)) chips.push('Finance');
  if (hasGradingModule(pkg)) chips.push('Academics');
  return chips;
}

/** Suggest the next package when upgrading with a new module. */
export function suggestPackageUpgrade(
  current: string | null | undefined,
  addModule: 'finance' | 'grading'
): SchoolPackageType {
  const pkg = normalizePackageType(current);
  if (pkg === 'full') return 'full';
  if (addModule === 'finance') {
    if (pkg === 'grading_only') return 'finance_grading';
    return 'finance_only';
  }
  if (pkg === 'finance_only') return 'finance_grading';
  return 'grading_only';
}

/** Primary user role seeded when a school is created. */
export function getPrimaryPortalRole(
  packageType: string | null | undefined
): 'admin' | 'bursar' | 'teacher' | 'school_admin' {
  const pkg = normalizePackageType(packageType);
  if (pkg === 'finance_only') return 'bursar';
  if (pkg === 'grading_only') return 'teacher';
  if (pkg === 'finance_grading') return 'school_admin';
  return 'admin';
}

export type PackageModule = 'admin' | 'finance' | 'grading';

const MODULE_LABELS: Record<PackageModule, string> = {
  admin: 'School Admin Portal',
  finance: FINANCE_PORTAL_LABEL,
  grading: ACADEMICS_PORTAL_LABEL,
};

/** Enabled workspace modules for a package. */
export function getEnabledModules(packageType: string | null | undefined): PackageModule[] {
  const pkg = normalizePackageType(packageType);
  const modules: PackageModule[] = [];
  if (hasFullAdminPortal(pkg)) modules.push('admin');
  if (hasFinanceModule(pkg)) modules.push('finance');
  if (hasGradingModule(pkg)) modules.push('grading');
  return modules;
}

/** Modules newly unlocked when moving from one package to another. */
export function getNewlyAddedModules(
  oldPackage: string | null | undefined,
  newPackage: string | null | undefined
): PackageModule[] {
  const previous = new Set(getEnabledModules(oldPackage));
  return getEnabledModules(newPackage).filter((module) => !previous.has(module));
}

export function getModuleLabel(module: PackageModule): string {
  return MODULE_LABELS[module];
}
