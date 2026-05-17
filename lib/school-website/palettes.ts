export type ColorPalette = {
  slug: string;
  name: string;
  primary: string;
  description: string;
};

export const COLOR_PALETTES: ColorPalette[] = [
  { slug: "ocean", name: "Ocean Teal", primary: "#0d9488", description: "Fresh academic teal" },
  { slug: "amber", name: "Amber Gold", primary: "#d97706", description: "Warm and welcoming" },
  { slug: "royal", name: "Royal Blue", primary: "#1d4ed8", description: "Traditional university blue" },
  { slug: "forest", name: "Forest Green", primary: "#15803d", description: "Natural and grounded" },
  { slug: "crimson", name: "Crimson", primary: "#b91c1c", description: "Bold institutional red" },
  { slug: "slate", name: "Slate Professional", primary: "#475569", description: "Neutral corporate tone" },
];

export function getPaletteBySlug(slug: string | null | undefined): ColorPalette | undefined {
  return COLOR_PALETTES.find((p) => p.slug === slug);
}

export function resolvePrimaryColor(
  colorTheme: string | null | undefined,
  paletteSlug: string | null | undefined
): string {
  if (colorTheme && /^#[0-9A-Fa-f]{6}$/.test(colorTheme.trim())) {
    return colorTheme.trim();
  }
  const palette = getPaletteBySlug(paletteSlug);
  return palette?.primary ?? "#d97706";
}
