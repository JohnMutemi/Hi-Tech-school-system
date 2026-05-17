import type { FolderSchoolSiteDefinition } from "@/lib/public-schools/types";
import type { WebsiteSectionRecord, WebsiteTemplateSlug } from "@/lib/school-website/types";

type SectionInput = {
  hero: { headline: string; subheadline: string; body: string };
  about: { title?: string; body: string };
  programmes?: { title?: string; items: { title: string; description?: string }[] };
  gallery?: { images: { url: string; alt?: string; caption?: string }[] };
  admissions: { body: string; bullets?: string[] };
  news?: { items: { title: string; description?: string }[] };
  contact: { bullets?: string[] };
};

export function buildFolderSiteDefinition(
  base: Omit<FolderSchoolSiteDefinition, "sections">,
  input: SectionInput
): FolderSchoolSiteDefinition {
  const sections: WebsiteSectionRecord[] = [
    {
      sectionKey: "hero",
      title: "Welcome",
      sortOrder: 0,
      isVisible: true,
      content: {
        headline: input.hero.headline,
        subheadline: input.hero.subheadline,
        body: input.hero.body,
        ctaLabel: "Apply for Admission",
        ctaHref: "#admissions",
      },
    },
    {
      sectionKey: "about",
      title: input.about.title ?? "About us",
      sortOrder: 1,
      isVisible: true,
      content: { body: input.about.body },
    },
    {
      sectionKey: "programmes",
      title: input.programmes?.title ?? "Programmes",
      sortOrder: 2,
      isVisible: true,
      content: { items: input.programmes?.items ?? [] },
    },
    {
      sectionKey: "gallery",
      title: "Campus life",
      sortOrder: 3,
      isVisible: true,
      content: {
        headline: "Our school in pictures",
        galleryImages: input.gallery?.images ?? [],
      },
    },
    {
      sectionKey: "admissions",
      title: "Admissions",
      sortOrder: 4,
      isVisible: true,
      content: {
        body: input.admissions.body,
        bullets: input.admissions.bullets,
        ctaLabel: "Enquire now",
        ctaHref: "#contact",
      },
    },
    {
      sectionKey: "news",
      title: "News & events",
      sortOrder: 5,
      isVisible: true,
      content: { items: input.news?.items ?? [] },
    },
    {
      sectionKey: "contact",
      title: "Contact",
      sortOrder: 6,
      isVisible: true,
      content: { bullets: input.contact.bullets ?? [] },
    },
  ];

  return { ...base, sections };
}

export type { WebsiteTemplateSlug };
