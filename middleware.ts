import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPlatformHost } from "@/lib/school-website/custom-domain-host";

async function lookupSchoolCodeForHost(host: string): Promise<string | null> {
  const secret = process.env.DOMAIN_LOOKUP_SECRET;
  const platformUrl = (
    process.env.PLATFORM_URL ||
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");

  if (!secret) {
    return null;
  }

  try {
    const url = new URL("/api/internal/domain-lookup", platformUrl);
    url.searchParams.set("host", host);
    const res = await fetch(url.toString(), {
      headers: { "x-domain-lookup-key": secret },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { schoolCode?: string };
    return data.schoolCode ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Redirect legacy teacher login path
  const teacherMatch = pathname.match(/^\/schools\/([^/]+)\/teacher\/login$/);
  if (teacherMatch) {
    url.pathname = `/schools/${teacherMatch[1]}/teachers/login`;
    return NextResponse.redirect(url);
  }

  // Legacy template public sites removed — use Lovable apps in public-schools/*
  if (pathname.startsWith("/site/") || pathname.startsWith("/public-school-sites/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

  if (!host || isPlatformHost(host)) {
    return NextResponse.next();
  }

  const schoolCode = await lookupSchoolCodeForHost(host);
  if (!schoolCode) {
    return NextResponse.next();
  }

  const platformUrl = (
    process.env.PLATFORM_URL ||
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");

  // Private app routes on a school custom domain → send users to the platform host
  if (
    pathname.startsWith("/schools") ||
    pathname.startsWith("/superadmin") ||
    pathname.startsWith("/demo")
  ) {
    return NextResponse.redirect(`${platformUrl}${pathname}${url.search}`);
  }

  // Block non-public APIs on custom domains (staff/data must use platform URL)
  if (pathname.startsWith("/api")) {
    const allowed = pathname === "/api/internal/domain-lookup";
    if (!allowed) {
      return NextResponse.json({ error: "Use the platform URL for this action" }, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
