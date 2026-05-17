import type { FolderSchoolSiteModule } from "@/lib/public-schools/types";

/** Vite marketing sites run from public-schools/* — not embedded in Next.js. See lib/public-schools/marketing-sites.ts */
const MODULES: FolderSchoolSiteModule[] = [];

const BY_ROUTE = new Map(
  MODULES.map((m) => [
    m.layout === "custom" ? m.routeSlug.toLowerCase() : m.definition.routeSlug.toLowerCase(),
    m,
  ]),
);

export const PUBLIC_SCHOOL_ROUTE_SLUGS = MODULES.map((m) =>
  m.layout === "custom" ? m.routeSlug : m.definition.routeSlug,
);

export function getFolderSchoolSiteModule(
  routeSlug: string,
): FolderSchoolSiteModule | undefined {
  return BY_ROUTE.get(routeSlug.toLowerCase());
}

export function isPublicSchoolFolderRoute(pathname: string): boolean {
  const segment = pathname.replace(/^\//, "").split("/")[0]?.toLowerCase();
  return Boolean(segment && BY_ROUTE.has(segment));
}

export function publicSchoolFolderPath(routeSlug: string): string {
  return `/${routeSlug.replace(/^\//, "")}`;
}

export function publicSchoolFolderRewritePath(routeSlug: string): string {
  return `/public-school-sites/${routeSlug.replace(/^\//, "")}`;
}

export function getFolderRouteForSchoolCode(schoolCode: string): string | null {
  const mod = getFolderSchoolSiteModule(schoolCode);
  if (!mod) return null;
  const slug = mod.layout === "custom" ? mod.routeSlug : mod.definition.routeSlug;
  return publicSchoolFolderPath(slug);
}
