import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from "next/server";

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

    console.log('Found parent and students:', { 
      parentId: parent.id, 
      parentName: parent.name, 
      studentsCount: students.length 
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
        className: student.class?.name || 'Not Assigned',
        classId: student.classId,
        gradeId: student.class?.gradeId,
        gradeName: student.class?.grade?.name || 'Not Assigned',
        academicYear: student.class?.academicYear || 'Not Assigned',
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
    console.error("Error fetching parent data:", error);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 }
    );
  }
} 