import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireUserSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { payload, school } = await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["teacher", "school_admin", "super_admin"]
    );
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    const term = searchParams.get("term") || undefined;
    const academicYear = searchParams.get("academicYear") || undefined;

    const db = prisma as any;
    const items = await db.assessment.findMany({
      where: {
        schoolId: school.id,
        ...(payload.role === "teacher" ? { createdByTeacherId: payload.userId } : {}),
        ...(classId ? { classId } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(term ? { term } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch assessments" }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { payload, school } = await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["teacher"]
    );
    const body = await request.json();
    const required = ["title", "classId", "subjectId", "term", "academicYear"];
    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json({ error: `${key} is required` }, { status: 400 });
      }
    }

    const classRecord = await prisma.class.findFirst({
      where: {
        id: body.classId,
        schoolId: school.id,
        teacherId: payload.userId,
      },
      select: { id: true },
    });
    if (!classRecord) {
      return NextResponse.json({ error: "You can only create assessments for your assigned classes" }, { status: 403 });
    }

    const subject = await prisma.subject.findFirst({
      where: { id: body.subjectId, schoolId: school.id },
      select: { id: true, teacherId: true },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    if (subject.teacherId && subject.teacherId !== payload.userId) {
      return NextResponse.json({ error: "Subject is not assigned to you" }, { status: 403 });
    }

    const db = prisma as any;
    const created = await db.assessment.create({
      data: {
        schoolId: school.id,
        classId: body.classId,
        subjectId: body.subjectId,
        createdByTeacherId: payload.userId,
        title: body.title,
        assessmentType: body.assessmentType || "test",
        term: body.term,
        academicYear: body.academicYear,
        totalMarks: Number(body.totalMarks ?? 100),
        weight: Number(body.weight ?? 1),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        isPublished: Boolean(body.isPublished),
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create assessment" }, { status: 400 });
  }
}
