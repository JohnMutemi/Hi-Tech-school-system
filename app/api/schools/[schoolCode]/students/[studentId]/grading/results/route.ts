import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireStudentSession, requireUserSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const userToken = request.cookies.get("auth_token")?.value;
    const studentToken = request.cookies.get("student_auth_token")?.value;

    let schoolId = "";
    let allowed = false;
    const normalizedSchoolCode = params.schoolCode.toLowerCase();

    if (studentToken) {
      const payload = await requireStudentSession(studentToken, params.schoolCode);
      if (payload.studentId !== params.studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const school = await prisma.school.findUnique({
        where: { code: normalizedSchoolCode },
        select: { id: true },
      });
      if (!school) {
        return NextResponse.json({ error: "School not found" }, { status: 404 });
      }
      schoolId = school.id;
      allowed = true;
    } else if (userToken) {
      const { school, payload } = await requireUserSession(userToken, params.schoolCode, [
        "school_admin",
        "super_admin",
        "teacher",
        "parent",
      ]);
      schoolId = school.id;
      if (payload.role === "parent") {
        const student = await prisma.student.findFirst({
          where: { id: params.studentId, parentId: payload.userId, schoolId },
          select: { id: true },
        });
        if (!student) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      allowed = true;
    }

    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || undefined;
    const academicYear = searchParams.get("academicYear") || undefined;

    const db = prisma as any;
    const results = await db.studentGradeResult.findMany({
      where: {
        schoolId,
        studentId: params.studentId,
        ...(term ? { term } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    });

    const avg =
      results.length > 0
        ? Number(
            (
              results.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) /
              results.length
            ).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      data: {
        summary: {
          totalSubjects: results.length,
          averageScore: avg,
          passCount: results.filter((r: any) => r.passStatus).length,
        },
        results,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch student results" }, { status: 400 });
  }
}
