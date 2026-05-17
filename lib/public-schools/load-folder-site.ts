import {
  folderDefinitionToPayload,
  type FolderSchoolSiteDefinition,
  type TemplateFolderSchoolSiteModule,
} from "@/lib/public-schools/types";
import { loadFolderSiteBranding } from "@/lib/public-schools/branding";
import { getFolderSchoolSiteModule } from "@/lib/public-schools/registry";
import type { PublicSchoolPayload } from "@/lib/school-website/types";

export async function loadFolderPublicSchoolSite(
  routeSlug: string
): Promise<PublicSchoolPayload | null> {
  const mod = getFolderSchoolSiteModule(routeSlug);
  if (!mod || mod.layout !== "template") return null;

  const def: FolderSchoolSiteDefinition = mod.definition;
  const branding = await loadFolderSiteBranding(def.schoolCode, def.colorTheme);
  return folderDefinitionToPayload(def, branding);
}

export function isTemplateFolderModule(
  mod: ReturnType<typeof getFolderSchoolSiteModule>
): mod is TemplateFolderSchoolSiteModule {
  return Boolean(mod && mod.layout === "template");
}
