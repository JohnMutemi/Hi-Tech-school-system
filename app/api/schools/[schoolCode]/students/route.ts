import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateNextAdmissionNumber } from '@/lib/utils/school-generator';

const prisma = new PrismaClient();

function getNextAdmissionNumber(lastAdmissionNumber: string): string {
  if (!lastAdmissionNumber) return '001';
  const match = lastAdmissionNumber.match(/(\d+)(?!.*\d)/);
  if (match) {
    const number = match[1];
    const next = (parseInt(number, 10) + 1).toString().padStart(number.length, '0');
    return lastAdmissionNumber.replace(/(\d+)(?!.*\d)/, next);
  }
  return lastAdmissionNumber + '1';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    
    const gradeId = searchParams.get("gradeId");
    const classId = searchParams.get("classId");
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Build where clause
    const whereClause: any = {
      schoolId: school.id,
      isActive: true,
    };

    // Filter by class if specified
    if (classId) {
      whereClause.classId = classId;
    } else if (gradeId) {
      // Filter by grade if class not specified
      whereClause.class = {
        gradeId: gradeId,
      };
    }

    // Filter by role if specified
    if (role) {
      whereClause.user = {
        role: role,
      };
    }

    // Add search filter if specified
    if (search) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          admissionNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          parent: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Fetch students with related data
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        class: {
          include: {
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          class: {
            grade: {
              name: "asc",
            },
          },
        },
        {
          class: {
            name: "asc",
          },
        },
        {
          user: {
            name: "asc",
          },
        },
      ],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const data = await req.json();
    const {
      name, email, phone, admissionNumber, dateOfBirth, dateAdmitted,
      parentName, parentPhone, parentEmail, address, gender, classId, avatarUrl,
      emergencyContact, medicalInfo, notes
    } = data;

    if (!name || !email || !classId) {
      return NextResponse.json({ error: 'Missing required fields: name, email, and classId are required.' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Admission number logic
    let finalAdmissionNumber = admissionNumber;
    if (!finalAdmissionNumber) {
      finalAdmissionNumber = getNextAdmissionNumber(school.lastAdmissionNumber || '');
    }

    // Fetch current academic year and term
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });
    let currentTerm = null;
    if (currentYear) {
      currentTerm = await prisma.term.findFirst({
        where: { academicYearId: currentYear.id, isCurrent: true },
      });
    }

    let parentUser = null;
    let parentTempPassword = 'parent123';
    if (parentPhone) {
      parentUser = await prisma.user.findFirst({
        where: {
          phone: parentPhone,
          role: 'parent',
          schoolId: school.id,
        },
      });
      const hashedParentPassword = await bcrypt.hash(parentTempPassword, 12);
      if (!parentUser) {
        parentUser = await prisma.user.create({
          data: {
            name: parentName || `Parent of ${name}`,
            email: parentEmail || `${parentPhone}@parent.local`,
            phone: parentPhone,
            role: 'parent',
            password: hashedParentPassword,
            isActive: true,
            schoolId: school.id,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: parentUser.id },
          data: { password: hashedParentPassword },
        });
      }
    }

    const hashedPassword = await bcrypt.hash('student123', 12);

    const studentUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'student',
        isActive: true,
        schoolId: school.id,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId: school.id,
        classId,
        admissionNumber: finalAdmissionNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateAdmitted: dateAdmitted ? new Date(dateAdmitted) : new Date(),
        parentName,
        parentPhone,
        parentEmail,
        address,
        gender,
        parentId: parentUser?.id,
        status: "active",
        avatarUrl,
        emergencyContact,
        medicalInfo,
        notes,
        isActive: true,
        currentAcademicYearId: currentYear?.id,
        currentTermId: currentTerm?.id,
        joinedAcademicYearId: currentYear?.id,
        joinedTermId: currentTerm?.id,
      },
      include: {
        user: true,
        parent: true,
        class: { include: { grade: true } }
      },
    });

    // Update school's lastAdmissionNumber after student creation
    if (finalAdmissionNumber) {
      await prisma.school.update({
        where: { id: school.id },
        data: { lastAdmissionNumber: finalAdmissionNumber },
      });
    }

    return NextResponse.json({
      ...student,
      name: studentUser.name,
      email: studentUser.email,
      phone: studentUser.phone,
      className: student.class?.name,
      gradeName: student.class?.grade?.name,
      parent: parentUser ? {
        ...parentUser,
        tempPassword: parentTempPassword,
      } : null,
    });

  } catch (error: any) {
    console.error('Failed to create student:', error);
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const body = await req.json();
    const studentId = body.studentId || body.id;
    const {
      name, email, phone, admissionNumber, dateOfBirth, dateAdmitted,
      parentName, parentPhone, parentEmail, address, gender, parentId,
      classId, status, avatarUrl, emergencyContact, medicalInfo, notes, isActive,
      currentAcademicYearId, currentTermId
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required for updating.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name: name,
        email: email,
        phone: phone,
        isActive: isActive,
      },
    });

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        admissionNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        dateAdmitted: dateAdmitted ? new Date(dateAdmitted) : undefined,
        parentName,
        parentPhone,
        parentEmail,
        address,
        gender,
        parentId,
        classId,
        status,
        avatarUrl,
        emergencyContact,
        medicalInfo,
        notes,
        isActive: typeof isActive === "boolean" ? isActive : (status === "active"),
        updatedAt: new Date(),
        currentAcademicYearId: currentAcademicYearId ?? student.currentAcademicYearId,
        currentTermId: currentTermId ?? student.currentTermId,
      },
      include: { user: true, parent: true, class: { include: { grade: true } } }
    });

    return NextResponse.json(updatedStudent);

  } catch (error: any) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const body = await req.json();
    // Accept both 'studentId' and 'id' for compatibility
    const studentId = body.studentId || body.id;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required for deletion.' }, { status: 400 });
    }
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Manually delete related records if no cascade rule exists
    // Example: await prisma.payment.deleteMany({ where: { studentId } });

    await prisma.student.delete({
      where: { id: studentId },
    });
    
    await prisma.user.delete({
      where: { id: student.userId },
    });
    
    return NextResponse.json({ success: true, message: "Student and associated user deleted." });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
