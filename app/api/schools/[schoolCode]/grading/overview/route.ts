import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || undefined;
    const academicYear = searchParams.get("academicYear") || undefined;

    const db = prisma as any;
    const results = await db.studentGradeResult.findMany({
      where: {
        schoolId: school.id,
        ...(term ? { term } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
      },
    });

    const totalResults = results.length;
    const passCount = results.filter((r: any) => r.passStatus).length;
    const failCount = totalResults - passCount;
    const averageScore =
      totalResults > 0
        ? Number(
            (
              results.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) /
              totalResults
            ).toFixed(2)
          )
        : 0;

    const distribution = results.reduce((acc: Record<string, number>, row: any) => {
      acc[row.letterGrade] = (acc[row.letterGrade] || 0) + 1;
      return acc;
    }, {});

    const bySubjectMap = new Map<string, { subjectId: string; subjectName: string; total: number; count: number }>();
    results.forEach((row: any) => {
      const key = row.subjectId;
      const existing = bySubjectMap.get(key) || {
        subjectId: row.subjectId,
        subjectName: row.subject?.name || "Subject",
        total: 0,
        count: 0,
      };
      existing.total += Number(row.percentage || 0);
      existing.count += 1;
      bySubjectMap.set(key, existing);
    });
    const subjectPerformance = Array.from(bySubjectMap.values()).map((item) => ({
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      average: Number((item.total / Math.max(item.count, 1)).toFixed(2)),
      entries: item.count,
    }));

    return NextResponse.json({
      data: {
        totalResults,
        passCount,
        failCount,
        passRate: totalResults > 0 ? Number(((passCount / totalResults) * 100).toFixed(2)) : 0,
        averageScore,
        distribution,
        subjectPerformance,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load grading overview" }, { status: 400 });
  }
}
