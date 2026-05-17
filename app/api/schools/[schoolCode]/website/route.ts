import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWebsiteEditorAccess, ApiGuardError } from "@/lib/api-guard";
import { getPaletteBySlug, resolvePrimaryColor } from "@/lib/school-website/palettes";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";
import { SchoolWebsiteSeedingService } from "@/lib/services/school-website-seeding-service";
import type { WebsiteSectionKey } from "@/lib/school-website/types";
import { WEBSITE_SECTION_KEYS } from "@/lib/school-website/default-sections";
import { sanitizeSectionContentForKey } from "@/lib/school-website/sanitize-section-content";
import { resolveSchoolCustomDomain } from "@/lib/school-website/resolve-school-custom-domain";
import { buildWebsiteSettingsResponse } from "@/lib/school-website/website-api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolContext } = await requireWebsiteEditorAccess(params.schoolCode);
    const school = await prisma.school.findUnique({
      where: { id: schoolContext.schoolId },
      include: { websiteSections: { orderBy: { sortOrder: "asc" } } },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (school.websiteSections.length === 0) {
      await SchoolWebsiteSeedingService.seedForSchool(
        school.id,
        school.name,
        school.websiteTemplateSlug,
        {
          motto: school.motto ?? undefined,
          principalName: school.principalName ?? undefined,
          description: school.description ?? undefined,
          address: school.address,
          establishedYear: school.establishedYear,
        }
      );
      const reloaded = await prisma.school.findUnique({
        where: { id: school.id },
        include: { websiteSections: { orderBy: { sortOrder: "asc" } } },
      });
      if (reloaded) {
        school.websiteSections = reloaded.websiteSections;
      }
    } else {
      await SchoolWebsiteSeedingService.ensureGallerySection(
        school.id,
        school.name,
        school.websiteTemplateSlug
      );
      const withGallery = await prisma.school.findUnique({
        where: { id: school.id },
        include: { websiteSections: { orderBy: { sortOrder: "asc" } } },
      });
      if (withGallery) {
        school.websiteSections = withGallery.websiteSections;
      }
    }

    return NextResponse.json(
      buildWebsiteSettingsResponse({
        ...school,
        websiteSections: school.websiteSections.map((s) => ({
          id: s.id,
          sectionKey: s.sectionKey,
          title: s.title,
          content: s.content,
          isVisible: s.isVisible,
          sortOrder: s.sortOrder,
        })),
      })
    );
  } catch (error) {
    if (error instanceof ApiGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load website settings" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolContext } = await requireWebsiteEditorAccess(params.schoolCode);
    const body = await request.json();
    const {
      sections,
      websiteTemplateSlug,
      colorPaletteSlug,
      colorTheme,
      publicWebsiteEnabled,
      customDomain,
      reseed,
    } = body;

    const school = await prisma.school.findUnique({
      where: { id: schoolContext.schoolId },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (websiteTemplateSlug !== undefined) {
      updateData.websiteTemplateSlug = normalizeTemplateSlug(websiteTemplateSlug);
    }
    if (colorPaletteSlug !== undefined) {
      const palette = getPaletteBySlug(colorPaletteSlug);
      updateData.colorPaletteSlug = palette?.slug ?? null;
      if (palette && colorTheme === undefined) {
        updateData.colorTheme = palette.primary;
      }
    }
    if (colorTheme !== undefined && /^#[0-9A-Fa-f]{6}$/.test(String(colorTheme).trim())) {
      updateData.colorTheme = String(colorTheme).trim();
    }
    if (publicWebsiteEnabled !== undefined) {
      updateData.publicWebsiteEnabled = Boolean(publicWebsiteEnabled);
    }

    if (customDomain !== undefined) {
      if (customDomain === null || String(customDomain).trim() === "") {
        updateData.customDomain = null;
      } else {
        const domainResult = await resolveSchoolCustomDomain({
          customDomain: String(customDomain),
          excludeSchoolId: school.id,
        });
        if (!domainResult.ok) {
          return NextResponse.json({ error: domainResult.error }, { status: domainResult.status });
        }
        updateData.customDomain = domainResult.customDomain;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.school.update({
        where: { id: school.id },
        data: updateData,
      });
    }

    if (reseed === true) {
      const updated = await prisma.school.findUnique({ where: { id: school.id } });
      await SchoolWebsiteSeedingService.seedForSchool(
        school.id,
        updated?.name ?? school.name,
        updated?.websiteTemplateSlug ?? school.websiteTemplateSlug,
        {
          motto: updated?.motto ?? undefined,
          principalName: updated?.principalName ?? undefined,
          description: updated?.description ?? undefined,
          address: updated?.address ?? school.address,
          establishedYear: updated?.establishedYear ?? school.establishedYear,
        }
      );
    }

    if (Array.isArray(sections)) {
      for (const section of sections) {
        const key = section.sectionKey as WebsiteSectionKey;
        if (!WEBSITE_SECTION_KEYS.includes(key)) continue;

        const safeContent = sanitizeSectionContentForKey(key, section.content);

        await prisma.schoolWebsiteSection.upsert({
          where: {
            schoolId_sectionKey: {
              schoolId: school.id,
              sectionKey: key,
            },
          },
          create: {
            schoolId: school.id,
            sectionKey: key,
            title: section.title ?? null,
            content: safeContent as object,
            isVisible: section.isVisible !== false,
            sortOrder: typeof section.sortOrder === "number" ? section.sortOrder : 0,
          },
          update: {
            title: section.title ?? null,
            content: safeContent as object,
            isVisible: section.isVisible !== false,
            sortOrder: typeof section.sortOrder === "number" ? section.sortOrder : 0,
          },
        });
      }
    }

    const refreshed = await prisma.school.findUnique({
      where: { id: school.id },
      include: { websiteSections: { orderBy: { sortOrder: "asc" } } },
    });

    if (!refreshed) {
      return NextResponse.json({ error: "Failed to reload school" }, { status: 500 });
    }

    return NextResponse.json(
      buildWebsiteSettingsResponse({
        ...refreshed,
        websiteSections: refreshed.websiteSections,
      })
    );
  } catch (error) {
    if (error instanceof ApiGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Website PUT error:", error);
    return NextResponse.json({ error: "Failed to update website" }, { status: 500 });
  }
}
