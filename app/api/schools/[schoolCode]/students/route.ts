import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode },
      include: {
        students: {
          include: {
            user: true,
            parent: true,
            class: {
              include: { grade: true }
            }
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const studentsWithDetails = school.students.map(student => ({
      ...student,
      name: student.user?.name,
      email: student.user?.email,
      phone: student.user?.phone,
      className: student.class?.name,
      gradeName: student.class?.grade?.name,
      parent: student.parent ? {
        name: student.parent.name,
        email: student.parent.email,
        phone: student.parent.phone,
      } : null,
    }));

    return NextResponse.json(studentsWithDetails);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch students' }, { status: 500 });
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
        admissionNumber: admissionNumber || `ADM${Date.now()}`,
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
      },
      include: {
        user: true,
        parent: true,
        class: { include: { grade: true } }
      },
    });

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
      classId, status, avatarUrl, emergencyContact, medicalInfo, notes, isActive
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
