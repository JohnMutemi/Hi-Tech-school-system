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

function resolveSchoolCode(): string {
  const code =
    (import.meta.env.VITE_SCHOOL_CODE as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_SCHOOL_CODE as string | undefined);
  if (!code?.trim()) throw new Error("VITE_SCHOOL_CODE is not set.");
  return code.trim().toLowerCase();
}

export function getStaffLoginUrl(): string {
  const base = resolvePlatformBase();
  const code = resolveSchoolCode();
  return `${base}/schools/${code}/staff`;
}