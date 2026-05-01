import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireUserSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; assessmentId: string } }
) {
  try {
    const { payload, school } = await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["teacher", "school_admin", "super_admin"]
    );
    const db = prisma as any;
    const assessment = await db.assessment.findFirst({
      where: {
        id: params.assessmentId,
        schoolId: school.id,
        ...(payload.role === "teacher" ? { createdByTeacherId: payload.userId } : {}),
      },
      include: {
        class: { include: { students: { include: { user: true } } } },
        scores: true,
      },
    });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    const scoreMap = new Map(
      (assessment.scores || []).map((score: any) => [score.studentId, score])
    );
    const students = (assessment.class?.students || []).map((student: any) => ({
      id: student.id,
      name: student.user?.name || "Student",
      admissionNumber: student.admissionNumber,
      rawScore: scoreMap.get(student.id)?.rawScore ?? null,
      remarks: scoreMap.get(student.id)?.remarks ?? "",
    }));

    return NextResponse.json({
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          totalMarks: assessment.totalMarks,
        },
        students,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load scores" }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string; assessmentId: string } }
) {
  try {
    const { payload, school } = await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["teacher"]
    );
    const body = await request.json();
    const entries = Array.isArray(body.entries) ? body.entries : [];

    const db = prisma as any;
    const assessment = await db.assessment.findFirst({
      where: {
        id: params.assessmentId,
        schoolId: school.id,
        createdByTeacherId: payload.userId,
      },
      include: { class: { select: { id: true } } },
    });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { classId: assessment.classId, schoolId: school.id, isActive: true },
      select: { id: true },
    });
    const allowedIds = new Set(students.map((s) => s.id));

    for (const entry of entries) {
      const rawScore = Number(entry.rawScore);
      if (!allowedIds.has(entry.studentId)) {
        return NextResponse.json({ error: "Invalid student in score payload" }, { status: 400 });
      }
      if (rawScore < 0 || rawScore > Number(assessment.totalMarks)) {
        return NextResponse.json(
          { error: `Score out of bounds for student ${entry.studentId}` },
          { status: 400 }
        );
      }
    }

    for (const entry of entries) {
      await db.studentScore.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: assessment.id,
            studentId: entry.studentId,
          },
        },
        create: {
          assessmentId: assessment.id,
          studentId: entry.studentId,
          rawScore: Number(entry.rawScore),
          remarks: entry.remarks || null,
        },
        update: {
          rawScore: Number(entry.rawScore),
          remarks: entry.remarks || null,
        },
      });
    }

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save scores" }, { status: 400 });
  }
}
