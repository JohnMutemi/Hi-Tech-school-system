import { buildDefaultSections } from "@/lib/school-website/default-sections";
import { staffPortalLoginPath } from "@/lib/staff-portal-path";
import { previewPublicSiteUrl } from "@/lib/school-website/resolve-school-custom-domain";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";
import type {
  GalleryImageItem,
  PublicSchoolPayload,
  SectionContent,
  WebsiteSectionKey,
  WebsiteSectionRecord,
  WebsiteTemplateSlug,
} from "@/lib/school-website/types";

function seedsToRecords(
  seeds: ReturnType<typeof buildDefaultSections>
): WebsiteSectionRecord[] {
  return seeds.map((s) => ({
    sectionKey: s.sectionKey,
    title: s.title,
    content: { ...s.content },
    isVisible: true,
    sortOrder: s.sortOrder,
  }));
}

function parseNewsHint(text: string): { title: string; description?: string }[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items: { title: string; description?: string }[] = [];
  for (const line of lines.slice(0, 5)) {
    const sep = line.indexOf(" – ");
    if (sep >= 0) {
      items.push({
        title: line.slice(0, sep).trim(),
        description: line.slice(sep + 3).trim(),
      });
      continue;
    }
    const dash = line.indexOf(" - ");
    if (dash >= 0) {
      items.push({
        title: line.slice(0, dash).trim(),
        description: line.slice(dash + 3).trim(),
      });
      continue;
    }
    items.push({ title: line, description: "" });
  }
  return items;
}

function resolvePublicSiteUrlForClient(
  schoolCode: string,
  websiteInput: string | null | undefined
): string {
  const pathOrUrl = previewPublicSiteUrl(schoolCode, websiteInput);
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }
  return pathOrUrl;
}

export function buildPublicSitePreviewPayload(input: {
  schoolCode: string;
  name: string;
  logo: string | null;
  colorTheme: string;
  packageType: string;
  websiteTemplateSlug: WebsiteTemplateSlug;
  websiteInput: string;
  motto: string | null;
  principalName: string | null;
  establishedYear: number | null;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  galleryImages: GalleryImageItem[];
  contentHints?: {
    aboutUs?: string;
    news?: string;
    admissions?: string;
  };
  aiSectionPatches?: Partial<
    Record<WebsiteSectionKey, { title?: string | null; content?: SectionContent | null }>
  >;
}): PublicSchoolPayload {
  const template = normalizeTemplateSlug(input.websiteTemplateSlug);
  const year = input.establishedYear;
  const seeds = buildDefaultSections(template, input.name.trim() || "Your school", {
    motto: input.motto ?? undefined,
    principalName: input.principalName ?? undefined,
    description: input.description ?? undefined,
    address: input.address,
    establishedYear: year && !Number.isNaN(year) ? year : undefined,
  });
  const sections = seedsToRecords(seeds);

  const gallery = sections.find((s) => s.sectionKey === "gallery");
  if (gallery && input.galleryImages.length > 0) {
    gallery.content = {
      ...gallery.content,
      galleryImages: input.galleryImages,
    };
  }

  const hints = input.contentHints;
  if (hints?.aboutUs?.trim()) {
    const about = sections.find((s) => s.sectionKey === "about");
    if (about) {
      about.content = { ...about.content, body: hints.aboutUs.trim() };
    }
  }
  if (hints?.admissions?.trim()) {
    const adm = sections.find((s) => s.sectionKey === "admissions");
    if (adm) {
      adm.content = { ...adm.content, body: hints.admissions.trim() };
    }
  }
  if (hints?.news?.trim()) {
    const news = sections.find((s) => s.sectionKey === "news");
    if (news) {
      const items = parseNewsHint(hints.news);
      if (items.length > 0) {
        news.content = { ...news.content, items };
      }
    }
  }

  if (input.aiSectionPatches) {
    for (const s of sections) {
      const patch = input.aiSectionPatches[s.sectionKey];
      if (!patch) continue;
      if (typeof patch.title === "string" && patch.title.trim()) {
        s.title = patch.title.trim();
      }
      if (patch.content && typeof patch.content === "object") {
        s.content = { ...patch.content };
      }
    }
  }

  const publicSiteUrl = resolvePublicSiteUrlForClient(
    input.schoolCode,
    input.websiteInput
  );

  return {
    schoolCode: input.schoolCode,
    name: input.name.trim() || "School name",
    logo: input.logo,
    colorTheme: input.colorTheme,
    packageType: input.packageType,
    websiteTemplateSlug: template,
    publicWebsiteEnabled: true,
    motto: input.motto,
    principalName: input.principalName,
    establishedYear: input.establishedYear,
    description: input.description,
    address: input.address || "",
    phone: input.phone || "",
    email: input.email || "",
    websiteUrl: input.websiteInput?.trim() || null,
    customDomain: null,
    publicSiteUrl,
    staffLoginUrl: staffPortalLoginPath(input.schoolCode, input.packageType),
    sections,
  };
}
