import { prisma } from "@/lib/prisma";
import { normalizePackageType } from "@/lib/school-package";
import { absolutePlatformPath } from "@/lib/school-website/platform-url";
import { staffPortalLoginPath } from "@/lib/staff-portal-path";
import { resolvePrimaryColor } from "@/lib/school-website/palettes";

export type FolderSiteBranding = {
  schoolCode: string;
  logo: string | null;
  colorTheme: string;
  packageType: string;
  staffLoginUrl: string;
  publicWebsiteEnabled: boolean;
};

function staffLoginPath(code: string, packageType: string): string {
  return staffPortalLoginPath(code, packageType);
}

export async function loadFolderSiteBranding(
  schoolCode: string,
  fallbackColor: string
): Promise<FolderSiteBranding | null> {
  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: "insensitive" }, isActive: true },
    select: {
      logo: true,
      colorTheme: true,
      colorPaletteSlug: true,
      packageType: true,
      publicWebsiteEnabled: true,
      code: true,
    },
  });

  if (!school) {
    return {
      schoolCode,
      logo: null,
      colorTheme: fallbackColor,
      packageType: "full",
      staffLoginUrl: absolutePlatformPath(staffLoginPath(schoolCode, "full")),
      publicWebsiteEnabled: true,
    };
  }

  const packageType = normalizePackageType(school.packageType);
  return {
    schoolCode: school.code,
    logo: school.logo,
    colorTheme: resolvePrimaryColor(school.colorTheme, school.colorPaletteSlug),
    packageType,
    staffLoginUrl: absolutePlatformPath(staffLoginPath(school.code, packageType)),
    publicWebsiteEnabled: school.publicWebsiteEnabled,
  };
}
