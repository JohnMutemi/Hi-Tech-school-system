const FINANCE_LOGIN_PATH = "/schools/waitaprogressiveacademy/finance/login";

/** Platform host (Next.js :3000), not the Vite marketing site port. */
function resolvePlatformBase(): string {
  const explicit =
    (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_PLATFORM_URL as string | undefined);
  if (explicit?.trim()) {
    return explicit.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "http://localhost:3000";
  }
  return "http://localhost:3000";
}

export function getStaffLoginUrl(): string {
  const base = resolvePlatformBase();
  return `${base.replace(/\/$/, "")}${FINANCE_LOGIN_PATH}`;
}
