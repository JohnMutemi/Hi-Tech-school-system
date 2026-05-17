import { getPublicSitePath, getPublicSiteUrl } from "@/lib/school-website/custom-domain";
import { getPlatformCnameTarget } from "@/lib/school-website/custom-domain-host";
import { absolutePlatformPath } from "@/lib/school-website/platform-url";
import { resolvePrimaryColor } from "@/lib/school-website/palettes";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";

type SchoolWebsiteRow = {
  code: string;
  customDomain: string | null;
  websiteTemplateSlug: string | null;
  colorPaletteSlug: string | null;
  colorTheme: string | null;
  publicWebsiteEnabled: boolean;
  websiteSections?: unknown[];
};

export function buildWebsiteSettingsResponse(school: SchoolWebsiteRow) {
  const path = getPublicSitePath(school.code);
  return {
    schoolCode: school.code,
    publicSiteUrl: getPublicSiteUrl(school.code, school.customDomain),
    platformSiteUrl: absolutePlatformPath(path),
    pathSiteUrl: path,
    customDomain: school.customDomain,
    websiteTemplateSlug: normalizeTemplateSlug(school.websiteTemplateSlug),
    colorPaletteSlug: school.colorPaletteSlug,
    colorTheme: resolvePrimaryColor(school.colorTheme, school.colorPaletteSlug),
    publicWebsiteEnabled: school.publicWebsiteEnabled,
    platformCnameTarget: getPlatformCnameTarget(),
    sections: school.websiteSections ?? [],
  };
}
