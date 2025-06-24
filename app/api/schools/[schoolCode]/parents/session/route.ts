import { type NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const token = request.cookies.get("parent_auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== "parent" || payload.schoolCode !== params.schoolCode.toLowerCase()) {
      return NextResponse.json({ error: "Invalid session for this school" }, { status: 401 });
    }

    // Fetch parent data
    const parent = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Fetch students associated with this parent
    const students = await prisma.student.findMany({
      where: {
        parentId: parent.id,
        schoolId: payload.schoolId,
        isActive: true
      },
      include: {
        user: true,
        class: true
      }
    });

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
      },
      students: students.map(student => ({
        id: student.id,
        userId: student.userId,
        admissionNumber: student.admissionNumber,
        name: student.user.name,
        phone: student.parentPhone,
        email: student.user.email,
        avatarUrl: student.avatarUrl,
        className: student.className || student.class?.name,
        classLevel: student.classLevel,
        classSection: student.classSection,
        academicYear: student.academicYear || student.class?.academicYear,
        dateOfBirth: student.dateOfBirth,
        dateAdmitted: student.dateAdmitted,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        address: student.address,
        gender: student.gender,
        status: student.status
      }))
    });
  } catch (error) {
    console.error("Parent session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 