import { prisma } from "@/lib/prisma";
import { getMarketingSiteUrl } from "@/lib/public-schools/marketing-sites";
import { absolutePlatformPath } from "@/lib/school-website/platform-url";
import {
  normalizeCustomDomain,
  isValidCustomDomain,
  getPlatformCnameTarget,
  isPlatformHost,
} from "@/lib/school-website/custom-domain-host";

export { normalizeCustomDomain, isValidCustomDomain, getPlatformCnameTarget };
export { isPlatformHost, getPlatformHostnames } from "@/lib/school-website/custom-domain-host";

export async function resolveSchoolCodeByHost(
  host: string | null | undefined
): Promise<string | null> {
  const hostname = host?.split(":")[0]?.toLowerCase();
  if (!hostname || isPlatformHost(hostname)) return null;

  const bare = hostname.replace(/^www\./, "");
  const candidates = [bare, `www.${bare}`]
    .map((h) => normalizeCustomDomain(h))
    .filter((h): h is string => Boolean(h));

  const unique = [...new Set(candidates)];

  for (const domain of unique) {
    const school = await prisma.school.findFirst({
      where: { customDomain: domain, isActive: true },
      select: { code: true },
    });
    if (school) return school.code;
  }

  return null;
}

/** @deprecated Next.js template public sites removed; use Lovable marketing apps. */
export function getPublicSitePath(_schoolCode: string): string {
  return "";
}

export function getPublicSiteUrl(
  schoolCode: string,
  customDomain: string | null | undefined
): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  return getMarketingSiteUrl(schoolCode) ?? "";
}
