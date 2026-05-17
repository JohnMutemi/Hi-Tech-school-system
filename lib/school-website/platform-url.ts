/** Canonical platform URL (no trailing slash). Used for staff login links and middleware lookups. */
export function getPlatformBaseUrl(): string {
  const raw =
    process.env.PLATFORM_URL ||
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function absolutePlatformPath(path: string): string {
  const base = getPlatformBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
