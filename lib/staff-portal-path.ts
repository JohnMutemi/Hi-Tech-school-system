import {
  ACADEMICS_PORTAL_LABEL,
  FINANCE_PORTAL_LABEL,
  hasFinanceModule,
  hasFullAdminPortal,
  hasGradingModule,
  isDualModulePackage,
  normalizePackageType,
} from '@/lib/school-package';

export type StaffPortalLinkId = 'admin' | 'finance' | 'academics' | 'modules';

export type StaffPortalLink = {
  id: StaffPortalLinkId;
  label: string;
  shortLabel: string;
  description: string;
  path: string;
};

function schoolBasePath(schoolCode: string): string {
  const code = String(schoolCode || '').trim().toLowerCase();
  return code ? `/schools/${code}` : '/schools';
}

export function modulePortalPickerPath(schoolCode: string): string {
  return `${schoolBasePath(schoolCode)}/modules`;
}

export function financePortalLoginPath(schoolCode: string): string {
  return `${schoolBasePath(schoolCode)}/finance/login`;
}

export function academicsPortalLoginPath(schoolCode: string): string {
  return `${schoolBasePath(schoolCode)}/grading/login`;
}

/** All staff entry links for a school's package (used by superadmin & onboarding). */
export function staffPortalLinks(
  schoolCode: string,
  packageType?: string | null
): StaffPortalLink[] {
  const base = schoolBasePath(schoolCode);
  const pkg = normalizePackageType(packageType);
  const links: StaffPortalLink[] = [];

  if (hasFullAdminPortal(pkg)) {
    links.push({
      id: 'admin',
      label: 'School Admin Portal',
      shortLabel: 'Full Package',
      description: 'Complete school management — students, staff, academics, and finance.',
      path: base,
    });
    return links;
  }

  if (hasFinanceModule(pkg)) {
    links.push({
      id: 'finance',
      label: FINANCE_PORTAL_LABEL,
      shortLabel: 'Finance Module',
      description: 'Fee collection, receipts, balances, and bursary operations.',
      path: financePortalLoginPath(schoolCode),
    });
  }

  if (hasGradingModule(pkg)) {
    links.push({
      id: 'academics',
      label: ACADEMICS_PORTAL_LABEL,
      shortLabel: 'Academics Module',
      description: 'CBC mark entry, report cards, class rankings, and grading scales.',
      path: academicsPortalLoginPath(schoolCode),
    });
  }

  return links;
}

/** Primary URL shared after school creation (single link or module picker). */
export function staffPortalLoginPath(schoolCode: string, packageType?: string | null): string {
  const pkg = normalizePackageType(packageType);
  if (isDualModulePackage(pkg)) {
    return modulePortalPickerPath(schoolCode);
  }
  const links = staffPortalLinks(schoolCode, packageType);
  return links[0]?.path ?? schoolBasePath(schoolCode);
}
