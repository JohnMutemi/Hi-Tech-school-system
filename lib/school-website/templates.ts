import type { WebsiteTemplateSlug } from "./types";

export type WebsiteTemplateMeta = {
  slug: WebsiteTemplateSlug;
  name: string;
  description: string;
  inspiration: string;
  previewAccent: string;
};

export const WEBSITE_TEMPLATES: WebsiteTemplateMeta[] = [
  {
    slug: "classic",
    name: "Classic (UoN-style)",
    description: "Top navigation, wide hero, news strip, and multi-column footer — flagship university feel.",
    inspiration: "University of Nairobi (flagship public university aesthetic)",
    previewAccent: "#1d4ed8",
  },
  {
    slug: "modern",
    name: "Modern (KU-style)",
    description: "Full-bleed hero, card grids, and bold call-to-action blocks.",
    inspiration: "Kenyatta University (campus energy)",
    previewAccent: "#0d9488",
  },
  {
    slug: "compact",
    name: "Compact (Embu-style)",
    description: "Efficient bands and side-by-side sections — strong regional college presence.",
    inspiration: "Embu University College / embuni.ac.ke style",
    previewAccent: "#15803d",
  },
  {
    slug: "minimal",
    name: "Minimal (Kabianga-style)",
    description: "Clean navigation with admissions and contact first — uncluttered public face.",
    inspiration: "University of Kabianga / kabianga.ac.ke style",
    previewAccent: "#475569",
  },
];

export const VALID_TEMPLATE_SLUGS = WEBSITE_TEMPLATES.map((t) => t.slug);

export function getTemplateBySlug(slug: string | null | undefined): WebsiteTemplateMeta {
  return WEBSITE_TEMPLATES.find((t) => t.slug === slug) ?? WEBSITE_TEMPLATES[0];
}

export function normalizeTemplateSlug(slug: string | null | undefined): WebsiteTemplateSlug {
  const value = (slug || "classic").trim().toLowerCase();
  if (VALID_TEMPLATE_SLUGS.includes(value as WebsiteTemplateSlug)) {
    return value as WebsiteTemplateSlug;
  }
  return "classic";
}
