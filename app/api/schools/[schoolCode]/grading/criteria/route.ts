import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SCALE_BANDS } from "@/lib/grading/defaults";
import { requireUserSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["school_admin", "super_admin", "teacher"]
    );
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode.toLowerCase() },
      select: { id: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const db = prisma as any;
    const criteria = await db.gradingCriteria.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: criteria });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load criteria" }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["school_admin", "super_admin"]
    );
    const body = await request.json();
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode.toLowerCase() },
      select: { id: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Criteria name is required" }, { status: 400 });
    }

    const db = prisma as any;
    if (body.isActive) {
      await db.gradingCriteria.updateMany({
        where: { schoolId: school.id },
        data: { isActive: false },
      });
    }

    const created = await db.gradingCriteria.create({
      data: {
        schoolId: school.id,
        name,
        description: body.description || null,
        passMark: Number(body.passMark ?? 50),
        scaleBands: Array.isArray(body.scaleBands) ? body.scaleBands : DEFAULT_SCALE_BANDS,
        isActive: Boolean(body.isActive),
      },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create criteria" }, { status: 400 });
  }
}
