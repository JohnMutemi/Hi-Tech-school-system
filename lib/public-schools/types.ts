import type { ComponentType } from "react";
import { absolutePlatformPath } from "@/lib/school-website/platform-url";
import type {
  PublicSchoolPayload,
  WebsiteSectionRecord,
  WebsiteTemplateSlug,
} from "@/lib/school-website/types";
import type { FolderSiteBranding } from "@/lib/public-schools/branding";

/** Static marketing site defined in `public-schools/{slug}/` — not edited in superadmin. */
export type FolderSchoolSiteDefinition = {
  routeSlug: string;
  schoolCode: string;
  name: string;
  websiteTemplateSlug: WebsiteTemplateSlug;
  colorTheme: string;
  logo?: string | null;
  packageType?: "full" | "finance_only";
  motto?: string | null;
  principalName?: string | null;
  establishedYear?: number | null;
  description?: string | null;
  address: string;
  phone: string;
  email: string;
  websiteUrl?: string | null;
  sections: WebsiteSectionRecord[];
};

export type CustomFolderSchoolSiteModule = {
  layout: "custom";
  routeSlug: string;
  schoolCode: string;
  fallbackColor: string;
  Site: ComponentType<{ branding: FolderSiteBranding | null }>;
};

export type TemplateFolderSchoolSiteModule = {
  layout: "template";
  definition: FolderSchoolSiteDefinition;
};

export type FolderSchoolSiteModule =
  | CustomFolderSchoolSiteModule
  | TemplateFolderSchoolSiteModule;

export function folderDefinitionToPayload(
  def: FolderSchoolSiteDefinition,
  branding?: {
    logo: string | null;
    colorTheme: string;
    packageType: string;
    staffLoginUrl: string;
    publicWebsiteEnabled: boolean;
  } | null
): PublicSchoolPayload {
  const packageType = branding?.packageType ?? def.packageType ?? "full";
  const route = `/${def.routeSlug}`;

  return {
    schoolCode: def.schoolCode,
    name: def.name,
    logo: branding?.logo ?? def.logo ?? null,
    colorTheme: branding?.colorTheme ?? def.colorTheme,
    packageType,
    websiteTemplateSlug: def.websiteTemplateSlug,
    publicWebsiteEnabled: branding?.publicWebsiteEnabled ?? true,
    motto: def.motto ?? null,
    principalName: def.principalName ?? null,
    establishedYear: def.establishedYear ?? null,
    description: def.description ?? null,
    address: def.address,
    phone: def.phone,
    email: def.email,
    websiteUrl: def.websiteUrl ?? null,
    customDomain: null,
    publicSiteUrl: route,
    staffLoginUrl:
      branding?.staffLoginUrl ?? absolutePlatformPath(`/schools/${def.schoolCode}`),
    sections: def.sections,
  };
}
