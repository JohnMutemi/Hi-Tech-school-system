import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import { withSchoolContext } from '@/lib/school-context';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';

const prisma = new PrismaClient();

// GET - List all teachers for a school
export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const teachers = await schoolManager.getTeachers();

    const transformedTeachers = teachers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      qualification: user.teacherProfile?.qualification,
      dateJoined: user.teacherProfile?.dateJoined,
      status: user.isActive ? 'active' : 'inactive'
    }));

    return NextResponse.json(transformedTeachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

// POST: Create a new teacher
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    console.log("POST /teachers params:", params);
    const schoolManager = withSchoolContext(params.schoolCode);
    const schoolContext = await schoolManager.initialize();

    const body = await request.json();
    console.log("POST /teachers body:", body);
    const { name, email, phone, qualification, dateJoined, tempPassword, employeeId, assignedClass, academicYear, status } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await hashDefaultPasswordByRole('teacher');

    const newTeacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        employeeId,
        role: 'teacher',
        isActive: status === 'active' || true,
        schoolId: schoolContext.schoolId, // Explicitly set schoolId
        teacherProfile: {
          create: {
            qualification,
            dateJoined: dateJoined ? new Date(dateJoined) : new Date(),
            tempPassword: 'teacher123', // Store default password for reference
          },
        },
      },
      include: { teacherProfile: true },
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error("Error in POST /teachers:", error);
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}

// PUT: Update a teacher
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();

    const body = await request.json();
    const { id, name, email, phone, qualification, dateJoined, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Validate that the teacher belongs to this school
    const isValidTeacher = await schoolManager.validateSchoolOwnership(id, prisma.user);
    if (!isValidTeacher) {
      return NextResponse.json({ error: "Teacher not found or access denied" }, { status: 404 });
    }

    const updatedTeacher = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        isActive: status === 'active',
        teacherProfile: {
          update: {
            qualification,
            dateJoined: dateJoined ? new Date(dateJoined) : undefined,
          },
        },
      },
      include: { teacherProfile: true },
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

// DELETE: Delete a teacher
export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
    try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Validate that the teacher belongs to this school
    const isValidTeacher = await schoolManager.validateSchoolOwnership(id, prisma.user);
    if (!isValidTeacher) {
      return NextResponse.json({ error: "Teacher not found or access denied" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
} 