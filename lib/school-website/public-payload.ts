import { prisma } from "@/lib/prisma";
import { normalizePackageType } from "@/lib/school-package";
import { getPublicSiteUrl } from "@/lib/school-website/custom-domain";
import { absolutePlatformPath } from "@/lib/school-website/platform-url";
import { staffPortalLoginPath } from "@/lib/staff-portal-path";
import { resolvePrimaryColor } from "@/lib/school-website/palettes";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";
import type { PublicSchoolPayload, SectionContent, WebsiteSectionRecord } from "@/lib/school-website/types";
import { SchoolWebsiteSeedingService } from "@/lib/services/school-website-seeding-service";

export async function loadPublicSchoolPayload(
  schoolCode: string
): Promise<PublicSchoolPayload | null> {
  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: "insensitive" } },
    include: {
      websiteSections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!school || !school.isActive) return null;

  let sectionRows = school.websiteSections;
  if (!sectionRows.some((s) => s.sectionKey === "gallery")) {
    await SchoolWebsiteSeedingService.ensureGallerySection(
      school.id,
      school.name,
      school.websiteTemplateSlug
    );
    sectionRows = await prisma.schoolWebsiteSection.findMany({
      where: { schoolId: school.id },
      orderBy: { sortOrder: "asc" },
    });
  }

  const sections: WebsiteSectionRecord[] = sectionRows.map((s) => ({
    sectionKey: s.sectionKey as WebsiteSectionRecord["sectionKey"],
    title: s.title,
    content: (s.content ?? {}) as SectionContent,
    isVisible: s.isVisible,
    sortOrder: s.sortOrder,
  }));

  const code = school.code;
  const packageType = normalizePackageType(school.packageType);

  return {
    schoolCode: code,
    name: school.name,
    logo: school.logo,
    colorTheme: resolvePrimaryColor(school.colorTheme, school.colorPaletteSlug),
    packageType,
    websiteTemplateSlug: normalizeTemplateSlug(school.websiteTemplateSlug),
    publicWebsiteEnabled: school.publicWebsiteEnabled,
    motto: school.motto,
    principalName: school.principalName,
    establishedYear: school.establishedYear,
    description: school.description,
    address: school.address,
    phone: school.phone,
    email: school.email,
    websiteUrl: school.websiteUrl,
    customDomain: school.customDomain,
    publicSiteUrl: getPublicSiteUrl(code, school.customDomain),
    staffLoginUrl: absolutePlatformPath(staffPortalLoginPath(code, packageType)),
    sections,
  };
}

export function schoolProfileFromRecord(school: {
  address: string;
  phone: string;
  email: string;
  motto: string | null;
  principalName: string | null;
  establishedYear: number | null;
  description: string | null;
  websiteUrl: string | null;
}) {
  return {
    address: school.address,
    phone: school.phone,
    email: school.email,
    website: school.websiteUrl ?? "",
    principalName: school.principalName ?? "",
    establishedYear: school.establishedYear?.toString() ?? new Date().getFullYear().toString(),
    description: school.description ?? "",
    motto: school.motto ?? "",
    type: "primary" as const,
  };
}
