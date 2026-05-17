import type { GalleryImageItem, SectionContent, WebsiteSectionKey } from "./types";

const MAX_GALLERY_IMAGES = 24;
const MAX_URL_LEN = 600_000;
const MAX_TEXT = 500;

export function sanitizeGalleryImages(raw: unknown): GalleryImageItem[] {
  if (!Array.isArray(raw)) return [];
  const out: GalleryImageItem[] = [];
  for (const item of raw.slice(0, MAX_GALLERY_IMAGES)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url || url.length > MAX_URL_LEN) continue;
    out.push({
      url,
      alt: typeof o.alt === "string" ? o.alt.trim().slice(0, MAX_TEXT) : undefined,
      caption: typeof o.caption === "string" ? o.caption.trim().slice(0, MAX_TEXT) : undefined,
    });
  }
  return out;
}

export function sanitizeSectionContentForKey(
  key: WebsiteSectionKey,
  content: unknown
): SectionContent {
  const c = (content && typeof content === "object" ? content : {}) as SectionContent;
  if (key === "gallery") {
    return {
      ...c,
      galleryImages: sanitizeGalleryImages(c.galleryImages),
    };
  }
  return c;
}
