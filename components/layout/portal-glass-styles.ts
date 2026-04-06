/** Shared glassmorphism utility classes for school portals */

export const portalGlassPanel =
  "backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl";

export const portalGlassPanelInner =
  "backdrop-blur-md bg-white/5 border border-white/15 rounded-2xl shadow-lg";

export const portalGlassHeaderBar =
  "backdrop-blur-md bg-white/10 border-b border-white/10";

/** Light / neutral dashboards (bursar, superadmin shell) */
export const portalGlassPanelLight =
  "backdrop-blur-md bg-white/70 border border-white/60 rounded-2xl shadow-xl";

export const portalPageBackdropLight =
  "min-h-screen bg-gradient-to-br from-slate-100/90 via-white/80 to-slate-200/90";

/** Validates hex; returns fallback if invalid */
export function portalAccentHex(
  hex: string | null | undefined,
  fallback: string
): string {
  if (typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex.trim())) {
    return hex.trim();
  }
  return fallback;
}
