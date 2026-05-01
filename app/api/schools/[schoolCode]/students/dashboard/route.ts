import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type JwtPayload = {
  role?: string;
  studentId?: string;
  schoolCode?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const token = request.cookies.get("student_auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (
      payload.role !== "student" ||
      payload.schoolCode !== params.schoolCode ||
      !payload.studentId
    ) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode },
      select: { id: true, name: true, colorTheme: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.studentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        class: {
          include: {
            grade: { select: { name: true } },
            teacher: { select: { name: true } },
            students: { where: { isActive: true }, select: { id: true } },
          },
        },
      },
    });
    if (!student || student.schoolId !== school.id) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [recentPayments, recentResults, allResults] = await Promise.all([
      prisma.payment.findMany({
        where: { studentId: student.id },
        orderBy: { paymentDate: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          receiptNumber: true,
          paymentMethod: true,
        },
      }),
      prisma.studentGradeResult.findMany({
        where: {
          studentId: student.id,
          status: "published",
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { subject: { select: { id: true, name: true, teacher: { select: { name: true } } } } },
      }),
      prisma.studentGradeResult.findMany({
        where: {
          studentId: student.id,
          status: "published",
        },
        include: { subject: { select: { id: true, name: true, teacher: { select: { name: true } } } } },
      }),
    ]);

    const averageScore =
      allResults.length > 0
        ? Number(
            (
              allResults.reduce((sum, row) => sum + Number(row.percentage || 0), 0) /
              allResults.length
            ).toFixed(2)
          )
        : null;

    const subjectMap = new Map<
      string,
      { name: string; teacherName: string | null; latestGrade: string | null; latestPercentage: number | null }
    >();
    allResults.forEach((row) => {
      const key = row.subjectId;
      const current = subjectMap.get(key);
      if (!current) {
        subjectMap.set(key, {
          name: row.subject?.name || "Subject",
          teacherName: row.subject?.teacher?.name || null,
          latestGrade: row.letterGrade ?? null,
          latestPercentage: Number(row.percentage ?? 0),
        });
      }
    });

    const recentActivities = [
      ...recentResults.map((row) => ({
        id: `grade-${row.id}`,
        type: "grade_result",
        text: `${row.subject?.name || "Subject"} result published`,
        date: row.updatedAt,
      })),
      ...recentPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        type: "payment",
        text: `Payment recorded (${payment.receiptNumber || "receipt pending"})`,
        date: payment.paymentDate,
      })),
    ]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 8);

    const notifications = [
      ...recentResults.slice(0, 4).map((row) => ({
        id: `result-note-${row.id}`,
        title: "New grading result published",
        message: `${row.subject?.name || "Subject"}: ${row.letterGrade || "N/A"} (${Math.round(
          Number(row.percentage || 0)
        )}%)`,
        type: "grading_result",
        createdAt: row.updatedAt,
      })),
      ...recentPayments.slice(0, 4).map((payment) => ({
        id: `payment-note-${payment.id}`,
        title: "Payment recorded",
        message: `KES ${Math.round(Number(payment.amount || 0)).toLocaleString()} received${
          payment.receiptNumber ? ` · ${payment.receiptNumber}` : ""
        }`,
        type: "payment",
        createdAt: payment.paymentDate,
      })),
    ]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);

    return NextResponse.json({
      data: {
        school: {
          name: school.name,
          colorTheme: school.colorTheme,
        },
        student: {
          id: student.id,
          name: student.user?.name || null,
          email: student.user?.email || null,
          admissionNumber: student.admissionNumber,
          className: student.class?.name || null,
          gradeName: student.class?.grade?.name || null,
          classTeacherName: student.class?.teacher?.name || null,
          classStudentCount: student.class?.students?.length || 0,
          avatarUrl: student.avatarUrl || null,
          status: student.status || "active",
        },
        academics: {
          averageScore,
          publishedResultsCount: allResults.length,
          subjects: Array.from(subjectMap.values()),
          recentResults: recentResults.map((row) => ({
            id: row.id,
            subjectName: row.subject?.name || "Subject",
            letterGrade: row.letterGrade,
            percentage: row.percentage,
            passStatus: row.passStatus,
            updatedAt: row.updatedAt,
          })),
        },
        attendance: null,
        notifications,
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load student dashboard" },
      { status: 500 }
    );
  }
}
