import { prisma } from "@/lib/prisma";
import { buildDefaultSections } from "@/lib/school-website/default-sections";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";
import type { WebsiteTemplateSlug } from "@/lib/school-website/types";
import type { WebsiteSectionSeedOptions } from "@/lib/school-website/website-section-seed-options";

export class SchoolWebsiteSeedingService {
  /** Adds missing `gallery` row for schools seeded before gallery existed */
  static async ensureGallerySection(
    schoolId: string,
    schoolName: string,
    templateSlug: string | null | undefined
  ) {
    const existing = await prisma.schoolWebsiteSection.findUnique({
      where: { schoolId_sectionKey: { schoolId, sectionKey: "gallery" } },
    });
    if (existing) return;

    const slug = normalizeTemplateSlug(templateSlug) as WebsiteTemplateSlug;
    const defaults = buildDefaultSections(slug, schoolName);
    const seed = defaults.find((s) => s.sectionKey === "gallery");
    if (!seed) return;

    await prisma.schoolWebsiteSection.create({
      data: {
        schoolId,
        sectionKey: seed.sectionKey,
        title: seed.title,
        content: seed.content as object,
        isVisible: true,
        sortOrder: seed.sortOrder,
      },
    });
  }

  static async seedForSchool(
    schoolId: string,
    schoolName: string,
    templateSlug: string | null | undefined,
    options?: WebsiteSectionSeedOptions
  ) {
    const slug = normalizeTemplateSlug(templateSlug) as WebsiteTemplateSlug;
    const defaults = buildDefaultSections(slug, schoolName, options);

    await prisma.schoolWebsiteSection.deleteMany({ where: { schoolId } });

    await prisma.schoolWebsiteSection.createMany({
      data: defaults.map((section) => ({
        schoolId,
        sectionKey: section.sectionKey,
        title: section.title,
        content: section.content as object,
        isVisible: true,
        sortOrder: section.sortOrder,
      })),
    });

    return { sectionsCreated: defaults.length, templateSlug: slug };
  }
}
