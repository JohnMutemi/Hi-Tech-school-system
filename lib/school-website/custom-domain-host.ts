import { getPlatformBaseUrl } from "@/lib/school-website/platform-url";

const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Strip protocol, path, port; lowercase hostname. Returns null if empty/invalid. */
export function normalizeCustomDomain(input: string | null | undefined): string | null {
  if (input == null) return null;
  let value = String(input).trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] ?? value;
  value = value.split(":")[0] ?? value;
  value = value.replace(/^www\./, "");

  if (!value || value === "localhost" || value.endsWith(".localhost")) {
    return null;
  }

  if (!DOMAIN_REGEX.test(value)) {
    return null;
  }

  return value;
}

export function isValidCustomDomain(input: string | null | undefined): boolean {
  if (!input || !String(input).trim()) return true;
  return normalizeCustomDomain(input) !== null;
}

export function getPlatformHostnames(): string[] {
  const fromEnv = (process.env.PLATFORM_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const defaults = ["localhost", "127.0.0.1"];
  try {
    const platformHost = new URL(getPlatformBaseUrl()).hostname.toLowerCase();
    if (platformHost) defaults.push(platformHost);
  } catch {
    /* ignore */
  }

  return [...new Set([...defaults, ...fromEnv])];
}

export function isPlatformHost(host: string | null | undefined): boolean {
  if (!host) return true;
  const normalized = host.split(":")[0]?.toLowerCase() ?? "";
  const bare = normalized.replace(/^www\./, "");
  return getPlatformHostnames().some(
    (p) => normalized === p || bare === p.replace(/^www\./, "")
  );
}

export function getPlatformCnameTarget(): string {
  if (process.env.PLATFORM_CNAME_TARGET) {
    return process.env.PLATFORM_CNAME_TARGET.trim();
  }
  try {
    return new URL(getPlatformBaseUrl()).hostname;
  } catch {
    return "your-app.vercel.app";
  }
}
