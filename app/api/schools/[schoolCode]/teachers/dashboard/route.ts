import { type NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type JwtPayload = {
  role?: string;
  userId?: string;
  schoolCode?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (
      payload.role !== "teacher" ||
      payload.schoolCode !== params.schoolCode ||
      !payload.userId
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

    const teacher = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        teacherProfile: true,
      },
    });
    if (!teacher || teacher.schoolId !== school.id || teacher.role !== "teacher") {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const [assignedClasses, subjects, assessments] = await Promise.all([
      prisma.class.findMany({
        where: {
          schoolId: school.id,
          teacherId: teacher.id,
          isActive: true,
        },
        include: {
          grade: { select: { name: true } },
          students: {
            where: { isActive: true },
            select: {
              id: true,
              admissionNumber: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.subject.findMany({
        where: {
          schoolId: school.id,
          teacherId: teacher.id,
          isActive: true,
        },
        select: { id: true, name: true, code: true },
      }),
      prisma.assessment.findMany({
        where: {
          schoolId: school.id,
          createdByTeacherId: teacher.id,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          term: true,
          academicYear: true,
          isPublished: true,
          createdAt: true,
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          scores: { select: { id: true } },
        },
      }),
    ]);

    const classIds = assignedClasses.map((item) => item.id);
    const classStudentCount = assignedClasses.reduce(
      (sum, item) => sum + item.students.length,
      0
    );

    const latestResults = classIds.length
      ? await prisma.studentGradeResult.findMany({
          where: {
            schoolId: school.id,
            classId: { in: classIds },
            gradedByTeacherId: teacher.id,
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: {
            student: { include: { user: { select: { name: true } } } },
            subject: { select: { name: true } },
          },
        })
      : [];

    const recentActivities = [
      ...assessments.map((assessment) => ({
        id: `assessment-${assessment.id}`,
        type: "assessment",
        text: `${assessment.title} created`,
        date: assessment.createdAt,
      })),
      ...latestResults.map((result) => ({
        id: `result-${result.id}`,
        type: "grade_result",
        text: `${result.student.user.name} graded in ${result.subject.name}`,
        date: result.updatedAt,
      })),
    ]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 10);

    const notifications = [
      ...assessments.slice(0, 5).map((assessment) => ({
        id: `assessment-note-${assessment.id}`,
        title: assessment.isPublished ? "Assessment published" : "Assessment created",
        message: `${assessment.title} · ${assessment.subject.name} (${assessment.class.name})`,
        type: assessment.isPublished ? "assessment_published" : "assessment_created",
        createdAt: assessment.createdAt,
      })),
      ...latestResults.slice(0, 5).map((result) => ({
        id: `result-note-${result.id}`,
        title: "Student result recorded",
        message: `${result.student.user.name} · ${result.subject.name} · ${result.letterGrade} (${Math.round(
          Number(result.percentage || 0)
        )}%)`,
        type: "grading_result",
        createdAt: result.updatedAt,
      })),
    ]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 10);

    return NextResponse.json({
      data: {
        school: {
          name: school.name,
          colorTheme: school.colorTheme,
        },
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          employeeId: teacher.employeeId,
          qualification: teacher.teacherProfile?.qualification || null,
        },
        assignedClasses: assignedClasses.map((cls) => ({
          id: cls.id,
          name: cls.name,
          gradeName: cls.grade?.name || null,
          studentCount: cls.students.length,
          students: cls.students.map((student) => ({
            id: student.id,
            name: student.user?.name || "Student",
            admissionNumber: student.admissionNumber,
          })),
        })),
        subjects,
        grading: {
          assessments: assessments.map((assessment) => ({
            id: assessment.id,
            title: assessment.title,
            subjectName: assessment.subject.name,
            className: assessment.class.name,
            term: assessment.term,
            academicYear: assessment.academicYear,
            isPublished: assessment.isPublished,
            scoreCount: assessment.scores.length,
            createdAt: assessment.createdAt,
          })),
          latestResults: latestResults.map((result) => ({
            id: result.id,
            studentName: result.student.user.name,
            subjectName: result.subject.name,
            percentage: result.percentage,
            letterGrade: result.letterGrade,
            passStatus: result.passStatus,
            updatedAt: result.updatedAt,
          })),
        },
        attendance: null,
        notifications,
        metrics: {
          classCount: assignedClasses.length,
          studentCount: classStudentCount,
          subjectCount: subjects.length,
        },
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load teacher dashboard" },
      { status: 500 }
    );
  }
}
