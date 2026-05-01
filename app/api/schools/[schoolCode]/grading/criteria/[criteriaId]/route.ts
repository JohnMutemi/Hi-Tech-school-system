import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireUserSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { schoolCode: string; criteriaId: string } }
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

    const db = prisma as any;
    const criteria = await db.gradingCriteria.findFirst({
      where: { id: params.criteriaId, schoolId: school.id },
    });
    if (!criteria) {
      return NextResponse.json({ error: "Criteria not found" }, { status: 404 });
    }

    if (body.isActive === true) {
      await db.gradingCriteria.updateMany({
        where: { schoolId: school.id },
        data: { isActive: false },
      });
    }

    const updated = await db.gradingCriteria.update({
      where: { id: params.criteriaId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.passMark !== undefined ? { passMark: Number(body.passMark) } : {}),
        ...(body.scaleBands !== undefined ? { scaleBands: body.scaleBands } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update criteria" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { schoolCode: string; criteriaId: string } }
) {
  try {
    await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["school_admin", "super_admin"]
    );

    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode.toLowerCase() },
      select: { id: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const db = prisma as any;
    const criteria = await db.gradingCriteria.findFirst({
      where: { id: params.criteriaId, schoolId: school.id },
    });
    if (!criteria) {
      return NextResponse.json({ error: "Criteria not found" }, { status: 404 });
    }
    await db.gradingCriteria.delete({ where: { id: params.criteriaId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete criteria" }, { status: 400 });
  }
}
