import { NextResponse } from "next/server";
import { COLOR_PALETTES } from "@/lib/school-website/palettes";

export async function GET() {
  return NextResponse.json(COLOR_PALETTES);
}
