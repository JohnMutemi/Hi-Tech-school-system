import { NextResponse } from "next/server";
import { WEBSITE_TEMPLATES } from "@/lib/school-website/templates";

export async function GET() {
  return NextResponse.json(WEBSITE_TEMPLATES);
}
