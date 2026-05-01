import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireParentSession } from "@/lib/grading/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const payload = await requireParentSession(
      request.cookies.get("parent_auth_token")?.value,
      params.schoolCode
    );

    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || undefined;
    const academicYear = searchParams.get("academicYear") || undefined;

    const students = await prisma.student.findMany({
      where: {
        parentId: payload.userId,
        schoolId: payload.schoolId,
        isActive: true,
      },
      select: {
        id: true,
        admissionNumber: true,
        user: { select: { name: true } },
      },
    });
    const studentIds = students.map((s) => s.id);

    const db = prisma as any;
    const results = await db.studentGradeResult.findMany({
      where: {
        schoolId: payload.schoolId,
        studentId: { in: studentIds },
        ...(term ? { term } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
      },
      orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    });

    const byStudent = students.map((student) => {
      const rows = results.filter((result: any) => result.studentId === student.id);
      const average =
        rows.length > 0
          ? Number(
              (
                rows.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) /
                rows.length
              ).toFixed(2)
            )
          : 0;
      return {
        studentId: student.id,
        studentName: student.user.name,
        admissionNumber: student.admissionNumber,
        average,
        resultCount: rows.length,
        passCount: rows.filter((r: any) => r.passStatus).length,
        rows,
      };
    });

    return NextResponse.json({ data: byStudent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch parent performance" }, { status: 400 });
  }
}
