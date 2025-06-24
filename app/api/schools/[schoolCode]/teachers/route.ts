import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET all teachers for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const teachers = await prisma.user.findMany({
      where: { schoolId: school.id, role: 'teacher' },
      include: { teacherProfile: true },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

// POST: Create a new teacher
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    console.log("POST /teachers params:", params);
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await request.json();
    console.log("POST /teachers body:", body);
    const { name, email, phone, qualification, dateJoined, tempPassword } = body;

    if (!name || !email || !tempPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const newTeacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'teacher',
        isActive: true,
        school: { connect: { id: school.id } },
        teacherProfile: {
          create: {
            qualification,
            dateJoined: dateJoined ? new Date(dateJoined) : new Date(),
            tempPassword,
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
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, email, phone, qualification, dateJoined, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    const updatedTeacher = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        isActive: status === 'active',
        teacherDetails: {
          update: {
            qualification,
            dateJoined: dateJoined ? new Date(dateJoined) : undefined,
          },
        },
      },
      include: { teacherDetails: true },
    });

    return NextResponse.json(updatedTeacher);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

// DELETE: Delete a teacher
export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
    try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
} 