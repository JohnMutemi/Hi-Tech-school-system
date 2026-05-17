const FINANCE_LOGIN_PATH = "/schools/thebridgeacademy/finance/login";

/** Platform host for staff/finance routes (Next.js), not the Vite marketing site port. */
function resolvePlatformBase(): string {
  const explicit =
    (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_PLATFORM_URL as string | undefined);
  if (explicit?.trim()) {
    return explicit.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function getStaffLoginUrl() {
  const base = resolvePlatformBase();
  return `${base.replace(/\/$/, "")}${FINANCE_LOGIN_PATH}`;
}