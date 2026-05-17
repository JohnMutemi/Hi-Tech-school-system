import { normalizePackageType } from "@/lib/finance-package-gate";
import { getPublicSiteUrl } from "@/lib/school-website/custom-domain";
import { resolvePrimaryColor } from "@/lib/school-website/palettes";
import { schoolProfileFromRecord } from "@/lib/school-website/public-payload";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";

function getPrimaryPortalRole(packageType: string | null | undefined): "admin" | "bursar" {
  return normalizePackageType(packageType) === "finance_only" ? "bursar" : "admin";
}

type SchoolWithUsers = {
  id: string;
  code: string;
  name: string;
  logo: string | null;
  colorTheme: string | null;
  colorPaletteSlug: string | null;
  websiteTemplateSlug: string | null;
  publicWebsiteEnabled: boolean;
  packageType: string;
  isActive: boolean;
  createdAt: Date;
  address: string;
  phone: string;
  email: string;
  motto: string | null;
  principalName: string | null;
  establishedYear: number | null;
  description: string | null;
  websiteUrl: string | null;
  customDomain?: string | null;
  admissionNumberFormat?: string | null;
  lastAdmissionNumber?: string | null;
  admissionNumberAutoIncrement?: boolean;
  feePaymentParentSmsEnabled?: boolean;
  users?: { id: string; name: string; email: string; role: string; isActive: boolean }[];
  students?: unknown[];
  classes?: unknown[];
};

export function transformSchoolForApi(
  school: SchoolWithUsers,
  extras?: { description?: string }
) {
  const theme = resolvePrimaryColor(school.colorTheme, school.colorPaletteSlug);
  const primaryRole = getPrimaryPortalRole(school.packageType);
  const primaryUser = school.users?.find((u) => u.role === primaryRole);
  const fallbackUser = school.users?.find((u) => u.role === "admin");

  return {
    id: school.id,
    schoolCode: school.code,
    name: school.name,
    logo: school.logo,
    logoUrl: school.logo ?? "",
    colorTheme: theme,
    colorPaletteSlug: school.colorPaletteSlug,
    websiteTemplateSlug: normalizeTemplateSlug(school.websiteTemplateSlug),
    publicWebsiteEnabled: school.publicWebsiteEnabled,
    customDomain: school.customDomain ?? null,
    publicSiteUrl: getPublicSiteUrl(school.code, school.customDomain ?? null),
    portalUrl: `/schools/${school.code}`,
    description: school.description || extras?.description || "",
    adminEmail: primaryUser?.email || fallbackUser?.email || school.email,
    adminPassword: "",
    adminFirstName: primaryUser?.name?.split(" ")[0] || fallbackUser?.name?.split(" ")[0] || "Admin",
    adminLastName:
      primaryUser?.name?.split(" ").slice(1).join(" ") ||
      fallbackUser?.name?.split(" ").slice(1).join(" ") ||
      "User",
    createdAt: school.createdAt.toISOString(),
    status: school.isActive ? "active" : "suspended",
    packageType: normalizePackageType(school.packageType),
    profile: schoolProfileFromRecord(school),
    admissionNumberFormat: school.admissionNumberFormat || "{SCHOOL_CODE}-{YEAR}-{SEQ}",
    lastAdmissionNumber: school.lastAdmissionNumber || "",
    admissionNumberAutoIncrement: school.admissionNumberAutoIncrement ?? true,
    feePaymentParentSmsEnabled: school.feePaymentParentSmsEnabled ?? false,
    teachers: [],
    students: [],
    subjects: [],
    classes: [],
  };
}
