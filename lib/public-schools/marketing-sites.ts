/**
 * Lovable / Vite marketing sites under `public-schools/*`.
 * These run independently (`pnpm dev:waita`, etc.) — not served by Next.js `/site/{code}`.
 */

export type MarketingSiteEntry = {
  folder: string;
  /** Root `package.json` script, e.g. `dev:waita` */
  devScript: string;
  /** Optional env var for deployed or local URL (no trailing slash) */
  envVar?: string;
};

/** School codes (lowercase) → marketing site folder */
const BY_SCHOOL_CODE: Record<string, MarketingSiteEntry> = {
  waitaprogressiveacademy: {
    folder: "waita-academy-showcase",
    devScript: "dev:waita",
    envVar: "NEXT_PUBLIC_MARKETING_WAITA_URL",
  },
  waitaprogressive: {
    folder: "waita-academy-showcase",
    devScript: "dev:waita",
    envVar: "NEXT_PUBLIC_MARKETING_WAITA_URL",
  },
  mwingiroyaljunior: {
    folder: "mwingi-royal-gateway",
    devScript: "dev:mwingi",
    envVar: "NEXT_PUBLIC_MARKETING_MWINGI_URL",
  },
  mwingiroyalacademy: {
    folder: "mwingi-royal-gateway",
    devScript: "dev:mwingi",
    envVar: "NEXT_PUBLIC_MARKETING_MWINGI_URL",
  },
  thebridgeacademy: {
    folder: "thebridgeacademy",
    devScript: "dev:bridge",
    envVar: "NEXT_PUBLIC_MARKETING_BRIDGE_URL",
  },
};

export function getMarketingSiteEntry(schoolCode: string): MarketingSiteEntry | null {
  const key = schoolCode.trim().toLowerCase();
  return BY_SCHOOL_CODE[key] ?? null;
}

/** Public URL when deployed or set in env; null if only a local Lovable app exists. */
export function getMarketingSiteUrl(schoolCode: string): string | null {
  const entry = getMarketingSiteEntry(schoolCode);
  if (!entry) return null;
  if (entry.envVar) {
    const raw = process.env[entry.envVar];
    if (raw?.trim()) return raw.trim().replace(/\/$/, "");
  }
  return null;
}

export function getMarketingSiteDevHint(schoolCode: string): string | null {
  const entry = getMarketingSiteEntry(schoolCode);
  if (!entry) return null;
  return `pnpm ${entry.devScript}  (folder: public-schools/${entry.folder})`;
}
