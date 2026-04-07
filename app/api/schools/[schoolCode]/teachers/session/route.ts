import { type NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const normalizedSchoolCode = params.schoolCode.toLowerCase();
    if (payload.role !== "teacher" || payload.schoolCode !== normalizedSchoolCode) {
      return NextResponse.json({ error: "Invalid session for this school" }, { status: 401 });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        teacherProfile: true,
        school: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!teacher || teacher.role !== "teacher" || !teacher.isActive) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        employeeId: teacher.employeeId,
        qualification: teacher.teacherProfile?.qualification ?? null,
        dateJoined: teacher.teacherProfile?.dateJoined ?? null,
        schoolName: teacher.school?.name ?? null,
        schoolCode: teacher.school?.code ?? normalizedSchoolCode,
      },
    });
  } catch (error) {
    console.error("Teacher session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
