import { prisma } from "@/lib/prisma";
import { getMarketingSiteUrl } from "@/lib/public-schools/marketing-sites";
import { isPlatformHost, normalizeCustomDomain } from "@/lib/school-website/custom-domain-host";

export type ResolveCustomDomainResult =
  | { ok: true; customDomain: string | null }
  | { ok: false; error: string; status: 400 | 409 };

/** Extract hostname from a website URL or bare domain input. */
export function hostnameFromWebsiteInput(input: string | null | undefined): string | null {
  if (input == null || !String(input).trim()) return null;
  const raw = String(input).trim();
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProto).hostname;
    return host || null;
  } catch {
    return normalizeCustomDomain(raw);
  }
}

/**
 * Resolve `School.customDomain` from an explicit hostname and/or website URL field.
 * Skips platform hosts. Returns 409 if the domain is taken by another school.
 */
export async function resolveSchoolCustomDomain(options: {
  customDomain?: string | null | undefined;
  websiteUrl?: string | null | undefined;
  excludeSchoolId?: string;
}): Promise<ResolveCustomDomainResult> {
  let normalized: string | null = null;

  const explicit = options.customDomain;
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== "") {
    normalized = normalizeCustomDomain(String(explicit));
    if (!normalized) {
      return {
        ok: false,
        error: "Invalid domain. Use a hostname like www.yourschool.ac.ke (no https://)",
        status: 400,
      };
    }
  } else {
    const host = hostnameFromWebsiteInput(options.websiteUrl);
    if (host && !isPlatformHost(host)) {
      normalized = normalizeCustomDomain(host);
    }
  }

  if (!normalized || isPlatformHost(normalized)) {
    return { ok: true, customDomain: null };
  }

  const taken = await prisma.school.findFirst({
    where: {
      customDomain: normalized,
      ...(options.excludeSchoolId ? { id: { not: options.excludeSchoolId } } : {}),
    },
    select: { code: true },
  });
  if (taken) {
    return {
      ok: false,
      error: `Domain is already used by school ${taken.code}`,
      status: 409,
    };
  }

  return { ok: true, customDomain: normalized };
}

/** Client-safe preview of the public site URL after create. */
export function previewPublicSiteUrl(
  schoolCode: string,
  websiteInput: string | null | undefined
): string {
  const code = schoolCode.trim().toLowerCase();
  if (!code) return "";
  const host = hostnameFromWebsiteInput(websiteInput);
  if (host && !isPlatformHost(host)) {
    const normalized = normalizeCustomDomain(host);
    if (normalized) return `https://${normalized}`;
  }
  return getMarketingSiteUrl(code) ?? "";
}
