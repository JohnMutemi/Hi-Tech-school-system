import {
  ACADEMICS_PORTAL_LABEL,
  FINANCE_PORTAL_LABEL,
  hasFinanceModule,
  hasFullAdminPortal,
  hasGradingModule,
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

/** Canonical staff login hub — all public "Staff login" links land here. */
export function staffLoginHubPath(schoolCode: string): string {
  return `${schoolBasePath(schoolCode)}/staff`;
}

/** @deprecated Use staffLoginHubPath — kept for backward-compatible redirects. */
export function modulePortalPickerPath(schoolCode: string): string {
  return staffLoginHubPath(schoolCode);
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
      shortLabel: 'Administration',
      description: 'Full system access — students, staff, finance, academics, and settings.',
      path: base,
    });
  }

  if (hasFinanceModule(pkg)) {
    links.push({
      id: 'finance',
      label: FINANCE_PORTAL_LABEL,
      shortLabel: 'Finance / Bursar',
      description: 'Fee collection, receipts, balances, and bursary operations.',
      path: financePortalLoginPath(schoolCode),
    });
  }

  if (hasGradingModule(pkg)) {
    links.push({
      id: 'academics',
      label: ACADEMICS_PORTAL_LABEL,
      shortLabel: 'Academics Officer',
      description: 'CBC mark entry, report cards, class rankings, and grading scales.',
      path: academicsPortalLoginPath(schoolCode),
    });
  }

  return links;
}

/** Primary URL shared after school creation and on public "Staff login" buttons. */
export function staffPortalLoginPath(_schoolCode: string, _packageType?: string | null): string {
  return staffLoginHubPath(_schoolCode);
}
