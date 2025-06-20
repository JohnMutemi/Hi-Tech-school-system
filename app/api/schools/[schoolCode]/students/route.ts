import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { students, users, schools } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const prisma = new PrismaClient();

// GET: List all students for a school
export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const school = await prisma.school.findUnique({
    where: { code: params.schoolCode },
    include: {
      students: {
        include: {
          parent: true, // include parent user
        },
      },
    },
  });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
  // Map students to include parent credentials if available
  const studentsWithParent = school.students.map(student => ({
    ...student,
    parent: student.parent ? {
      email: student.parent.email,
      tempPassword: student.parent.tempPassword || null,
    } : null,
  }));
  return NextResponse.json(studentsWithParent);
}

// POST: Create a new student for a school
export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const data = await req.json();
  const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

  const student = await prisma.student.create({
    data: {
      ...data,
      schoolId: school.id,
    },
    include: { parent: true }, // include parent user
  });
  // Return student and parent credentials if available
  return NextResponse.json({
    ...student,
    parent: student.parent ? {
      email: student.parent.email,
      tempPassword: student.parent.tempPassword || null,
    } : null,
  });
}

// PUT: Update a student (expects studentId in body)
export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const body = await req.json();
    const { studentId, name, email, classId, admissionNumber, dateOfBirth, parentId, isActive } = body;
    // Find student
    const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    // Update user info
    await db.update(users).set({
      name,
      email,
      updatedAt: new Date(),
    }).where(eq(users.id, student.userId));
    // Update student info
    await db.update(students).set({
      classId,
      admissionNumber,
      dateOfBirth,
      parentId,
      isActive,
      updatedAt: new Date(),
    }).where(eq(students.id, studentId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

// DELETE: Remove a student (expects studentId in body)
export async function DELETE(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const body = await req.json();
    const { studentId } = body;
    // Find student
    const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    // Delete student record
    await db.delete(students).where(eq(students.id, studentId));
    // Optionally, delete user record
    await db.delete(users).where(eq(users.id, student.userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
} 