import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolCode: string; parentId: string } }
) {
  try {
    const { schoolCode, parentId } = params;

    // Decode URL-encoded school code
    const decodedSchoolCode = decodeURIComponent(schoolCode);

    console.log('Fetching parent data:', { schoolCode: decodedSchoolCode, parentId });

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: decodedSchoolCode },
    });

    if (!school) {
      console.log('School not found:', decodedSchoolCode);
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Find the parent
    const parent = await prisma.user.findFirst({
      where: {
        id: parentId,
        schoolId: school.id,
        role: "parent",
        isActive: true
      },
    });

    if (!parent) {
      console.log('Parent not found:', parentId);
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Find all students associated with this parent
    const students = await prisma.student.findMany({
      where: {
        parentId: parent.id,
        schoolId: school.id,
        isActive: true
      },
      include: {
        user: true,
        class: {
          include: {
            grade: true
          }
        }
      }
    });

    const currentAcademicYearRecord = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
      orderBy: { startDate: "desc" },
    });
    const currentAcademicYearName =
      currentAcademicYearRecord?.name ?? new Date().getFullYear().toString();

    console.log('Found parent and students:', { 
      parentId: parent.id, 
      parentName: parent.name, 
      studentsCount: students.length 
    });

    return NextResponse.json({
      schoolName: school.name,
      schoolCode: school.code,
      colorTheme: school.colorTheme ?? null,
      feePaymentParentSmsEnabled: school.feePaymentParentSmsEnabled ?? false,
      currentAcademicYearId: currentAcademicYearRecord?.id ?? null,
      currentAcademicYearName,
      parent: {
        id: parent.id,
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        schoolName: school.name,
        school: { name: school.name, code: school.code },
      },
      students: students.map(student => ({
        id: student.id,
        userId: student.userId,
        admissionNumber: student.admissionNumber,
        name: student.user.name,
        phone: student.parentPhone,
        email: student.user.email,
        avatarUrl: student.avatarUrl,
        className: student.class?.name || 'Not Assigned',
        classId: student.classId,
        gradeId: student.class?.gradeId,
        gradeName: student.class?.grade?.name || 'Not Assigned',
        academicYear: currentAcademicYearName,
        currentAcademicYearName,
        dateOfBirth: student.dateOfBirth,
        dateAdmitted: student.dateAdmitted,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        address: student.address,
        gender: student.gender,
        status: student.status,
        feePaymentSmsOptIn: student.feePaymentSmsOptIn ?? false,
      }))
    });

  } catch (error) {
    console.error("Error fetching parent data:", error);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { schoolCode: string; parentId: string } }
) {
  try {
    const token = req.cookies.get("parent_auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let payload: { role?: string; userId?: string; schoolCode?: string; schoolId?: string };
    try {
      payload = verify(token, process.env.JWT_SECRET!) as typeof payload;
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const decodedSchoolCode = decodeURIComponent(params.schoolCode).toLowerCase();
    if (
      payload.role !== "parent" ||
      payload.userId !== params.parentId ||
      (payload.schoolCode && payload.schoolCode.toLowerCase() !== decodedSchoolCode)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const studentId = body.studentId as string | undefined;
    const feePaymentSmsOptIn = body.feePaymentSmsOptIn;

    if (!studentId || typeof feePaymentSmsOptIn !== "boolean") {
      return NextResponse.json(
        { error: "studentId and boolean feePaymentSmsOptIn are required" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findFirst({
      where: { code: { equals: decodedSchoolCode, mode: "insensitive" } },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: params.parentId,
        schoolId: school.id,
        isActive: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { feePaymentSmsOptIn },
      select: { id: true, feePaymentSmsOptIn: true },
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error("Error updating parent SMS preference:", error);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 }
    );
  }
}