import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireUserSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

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
    const { criteriaId } = await request.json();
    if (!criteriaId) {
      return NextResponse.json({ error: "criteriaId is required" }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode.toLowerCase() },
      select: { id: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const db = prisma as any;
    const criteria = await db.gradingCriteria.findFirst({
      where: { id: criteriaId, schoolId: school.id },
    });
    if (!criteria) {
      return NextResponse.json({ error: "Criteria not found" }, { status: 404 });
    }

    await db.gradingCriteria.updateMany({
      where: { schoolId: school.id },
      data: { isActive: false },
    });
    const activated = await db.gradingCriteria.update({
      where: { id: criteriaId },
      data: { isActive: true },
    });
    return NextResponse.json({ data: activated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to activate criteria" }, { status: 400 });
  }
}
