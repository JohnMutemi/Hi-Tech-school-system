import { prisma } from "@/lib/prisma";
import { WEBSITE_SECTION_KEYS } from "@/lib/school-website/default-sections";
import { sanitizeSectionContentForKey } from "@/lib/school-website/sanitize-section-content";
import type { SectionContent, WebsiteSectionKey } from "@/lib/school-website/types";

/**
 * Optional AI draft for public website sections.
 * Uses Google Gemini when GEMINI_API_KEY or GOOGLE_AI_API_KEY is set (free tier on Google AI Studio has generous limits).
 * No calls are made unless the school-creation request sets aiWebsiteDraft: true.
 */
const DEFAULT_MODEL = "gemini-2.0-flash";

function parseJsonPayload(text: string): unknown {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/u, "");
  }
  return JSON.parse(t) as unknown;
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "").trim()
  );
}

export type GeminiWebsiteBrief = {
  schoolName: string;
  templateSlug: string;
  motto?: string | null;
  principalName?: string | null;
  address?: string;
  description?: string | null;
  /** Optional copy supplied by superadmin — folded into the model brief */
  aboutUs?: string | null;
  newsNotes?: string | null;
  admissionsNotes?: string | null;
};

/**
 * Calls Gemini and returns sanitized section content (no database writes).
 * Used for superadmin preview and for {@link applyGeminiWebsiteDraft}.
 */
export async function requestGeminiWebsiteSections(brief: GeminiWebsiteBrief): Promise<
  | {
      ok: true;
      sections: Partial<
        Record<WebsiteSectionKey, { title: string | null; content: SectionContent }>
      >;
    }
  | { ok: false; error: string }
> {
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    ""
  ).trim();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY or GOOGLE_AI_API_KEY not set" };
  }

  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const briefPayload = {
    institutionName: brief.schoolName,
    layoutPreset: brief.templateSlug,
    motto: brief.motto ?? "",
    headOfInstitution: brief.principalName ?? "",
    location: brief.address ?? "",
    notesFromAdmin: brief.description ?? "",
    publicAboutUs: brief.aboutUs ?? "",
    recentNewsOrEvents: brief.newsNotes ?? "",
    admissionsUpdates: brief.admissionsNotes ?? "",
  };

  const prompt = `You write concise public website copy for Kenyan schools and universities.
Return ONLY valid JSON (no markdown fences) with this exact shape:
{"sections":[
  {"sectionKey":"hero","title":"string","content":{...}},
  ...
]}
Rules:
- sectionKey must be exactly one of: hero, about, programmes, gallery, admissions, news, contact.
- Include all seven keys in the array.
- Tone: formal, warm, suitable for parents and students.
- hero.content: headline, subheadline, body (max ~350 chars), ctaLabel, ctaHref (use #admissions, #contact, or #programmes only).
- about.content: headline, body, bullets (array of 3–4 short strings).
- programmes.content: headline, body, items array of 4 {title, description}.
- gallery.content: headline, body, galleryImages: [] (empty array only).
- admissions.content: headline, body, bullets, ctaLabel, ctaHref.
- news.content: headline, items array of 3 {title, description}.
- contact.content: headline, body, bullets.

If publicAboutUs, recentNewsOrEvents, or admissionsUpdates are non-empty in the brief, incorporate them faithfully (do not contradict them).

Brief (use real institution name and facts; do not invent accreditation):
${JSON.stringify(briefPayload)}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `Gemini HTTP ${res.status}: ${errText.slice(0, 280)}`,
      };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (data.error?.message) {
      return { ok: false, error: data.error.message };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text?.trim()) {
      return { ok: false, error: "Empty Gemini response" };
    }

    let parsed: { sections?: { sectionKey?: string; title?: string; content?: unknown }[] };
    try {
      parsed = parseJsonPayload(text) as typeof parsed;
    } catch {
      return { ok: false, error: "Could not parse Gemini JSON" };
    }

    const rows = Array.isArray(parsed.sections) ? parsed.sections : [];
    const byKey = new Map<string, { title?: string; content: unknown }>();

    for (const row of rows) {
      if (!row?.sectionKey || typeof row.sectionKey !== "string") continue;
      const key = row.sectionKey as WebsiteSectionKey;
      if (!WEBSITE_SECTION_KEYS.includes(key)) continue;
      byKey.set(row.sectionKey, {
        title: typeof row.title === "string" ? row.title : undefined,
        content: row.content,
      });
    }

    const sections: Partial<
      Record<WebsiteSectionKey, { title: string | null; content: SectionContent }>
    > = {};

    for (const key of WEBSITE_SECTION_KEYS) {
      const row = byKey.get(key);
      if (!row) continue;
      const safe = sanitizeSectionContentForKey(key, row.content);
      sections[key] = {
        title:
          typeof row.title === "string" && row.title.trim() ? row.title.trim() : null,
        content: safe,
      };
    }

    return { ok: true, sections };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gemini request failed",
    };
  }
}

export async function applyGeminiWebsiteDraft(params: {
  schoolId: string;
  schoolName: string;
  templateSlug: string;
  motto?: string | null;
  principalName?: string | null;
  address?: string;
  description?: string | null;
  aboutUs?: string | null;
  newsNotes?: string | null;
  admissionsNotes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const result = await requestGeminiWebsiteSections({
    schoolName: params.schoolName,
    templateSlug: params.templateSlug,
    motto: params.motto,
    principalName: params.principalName,
    address: params.address,
    description: params.description,
    aboutUs: params.aboutUs,
    newsNotes: params.newsNotes,
    admissionsNotes: params.admissionsNotes,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    for (const key of WEBSITE_SECTION_KEYS) {
      const row = result.sections[key];
      if (!row) continue;
      await prisma.schoolWebsiteSection.updateMany({
        where: { schoolId: params.schoolId, sectionKey: key },
        data: {
          ...(row.title ? { title: row.title } : {}),
          content: row.content as object,
        },
      });
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save Gemini sections",
    };
  }
}
