import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  requestGeminiWebsiteSections,
  isGeminiConfigured,
} from "@/lib/school-website/gemini-website-draft";
import { normalizeTemplateSlug } from "@/lib/school-website/templates";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ geminiConfigured: isGeminiConfigured() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "Gemini is not configured (set GEMINI_API_KEY on the server)." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const schoolName = typeof body.schoolName === "string" ? body.schoolName.trim() : "";
  if (!schoolName) {
    return NextResponse.json({ error: "schoolName is required" }, { status: 400 });
  }

  const templateSlug = normalizeTemplateSlug(
    typeof body.templateSlug === "string" ? body.templateSlug : "classic"
  );

  const result = await requestGeminiWebsiteSections({
    schoolName,
    templateSlug,
    motto: typeof body.motto === "string" ? body.motto : null,
    principalName: typeof body.principalName === "string" ? body.principalName : null,
    address: typeof body.address === "string" ? body.address : "",
    description: typeof body.description === "string" ? body.description : null,
    aboutUs: typeof body.aboutUs === "string" ? body.aboutUs : null,
    newsNotes: typeof body.newsNotes === "string" ? body.newsNotes : null,
    admissionsNotes: typeof body.admissionsNotes === "string" ? body.admissionsNotes : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ sections: result.sections });
}
