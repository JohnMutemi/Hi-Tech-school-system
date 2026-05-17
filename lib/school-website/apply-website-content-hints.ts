import { prisma } from "@/lib/prisma";
import type { SectionContent } from "@/lib/school-website/types";

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

/** Merge superadmin-supplied copy into seeded website sections (no AI required). */
export async function applyWebsiteContentHints(params: {
  schoolId: string;
  aboutUs?: string | null;
  news?: string | null;
  admissions?: string | null;
}): Promise<void> {
  const aboutUs = params.aboutUs?.trim();
  if (aboutUs) {
    const row = await prisma.schoolWebsiteSection.findUnique({
      where: {
        schoolId_sectionKey: { schoolId: params.schoolId, sectionKey: "about" },
      },
    });
    if (row) {
      const prev = (row.content as SectionContent) ?? {};
      await prisma.schoolWebsiteSection.update({
        where: {
          schoolId_sectionKey: { schoolId: params.schoolId, sectionKey: "about" },
        },
        data: { content: { ...prev, body: aboutUs } as object },
      });
    }
  }

  const admissions = params.admissions?.trim();
  if (admissions) {
    const row = await prisma.schoolWebsiteSection.findUnique({
      where: {
        schoolId_sectionKey: { schoolId: params.schoolId, sectionKey: "admissions" },
      },
    });
    if (row) {
      const prev = (row.content as SectionContent) ?? {};
      await prisma.schoolWebsiteSection.update({
        where: {
          schoolId_sectionKey: { schoolId: params.schoolId, sectionKey: "admissions" },
        },
        data: { content: { ...prev, body: admissions } as object },
      });
    }
  }

  const newsRaw = params.news?.trim();
  if (newsRaw) {
    const row = await prisma.schoolWebsiteSection.findUnique({
      where: {
        schoolId_sectionKey: { schoolId: params.schoolId, sectionKey: "news" },
      },
    });
    if (row) {
      const items = parseNewsHint(newsRaw);
      if (items.length > 0) {
        const prev = (row.content as SectionContent) ?? {};
        await prisma.schoolWebsiteSection.update({
          where: {
            schoolId_sectionKey: { schoolId: params.schoolId, sectionKey: "news" },
          },
          data: { content: { ...prev, items } as object },
        });
      }
    }
  }
}
