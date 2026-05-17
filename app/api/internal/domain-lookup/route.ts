import { NextRequest, NextResponse } from "next/server";
import { resolveSchoolCodeByHost } from "@/lib/school-website/custom-domain";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.DOMAIN_LOOKUP_SECRET;
  const provided = request.headers.get("x-domain-lookup-key");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const host = request.nextUrl.searchParams.get("host");
  if (!host) {
    return NextResponse.json({ error: "host required" }, { status: 400 });
  }

  const schoolCode = await resolveSchoolCodeByHost(host);
  if (!schoolCode) {
    return NextResponse.json({ error: "School not found for host" }, { status: 404 });
  }

  return NextResponse.json({ schoolCode });
}
