const DEFAULT_THEME = "#3b82f6";

function normalizeHex(hex?: string | null): string {
  if (!hex) return DEFAULT_THEME;
  const value = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return DEFAULT_THEME;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(hexA: string, hexB: string, weight: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    Math.round(a.r * (1 - w) + b.r * w),
    Math.round(a.g * (1 - w) + b.g * w),
    Math.round(a.b * (1 - w) + b.b * w)
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function getSchoolThemeTokens(colorTheme?: string | null) {
  const primary = normalizeHex(colorTheme);
  const primaryDark = mix(primary, "#0f172a", 0.42);
  const primaryDeeper = mix(primary, "#020617", 0.64);
  const primaryLight = mix(primary, "#ffffff", 0.82);
  const primarySoft = mix(primary, "#ffffff", 0.92);

  return {
    primary,
    primaryDark,
    primaryDeeper,
    primaryLight,
    primarySoft,
    border: mix(primary, "#e2e8f0", 0.65),
  };
}

export function getWorkspaceThemeTokens(colorTheme?: string | null) {
  const primary = normalizeHex(colorTheme);
  // Blend with teal to provide a dependable secondary accent
  // regardless of the chosen primary theme color.
  const secondary = mix(primary, "#14b8a6", 0.55);

  return {
    primary,
    secondary,
    primarySoft: mix(primary, "#ffffff", 0.9),
    primaryMuted: mix(primary, "#e2e8f0", 0.78),
    secondarySoft: mix(secondary, "#ffffff", 0.88),
    secondaryMuted: mix(secondary, "#e2e8f0", 0.74),
  };
}

