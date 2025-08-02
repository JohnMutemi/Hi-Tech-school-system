import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, students, schools } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';

const prisma = new PrismaClient();

// GET: List all parents for a school, or fetch a specific parent and their students
export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parentId');
  if (!parentId) return NextResponse.json({ error: 'parentId required' }, { status: 400 });

  const parent = await prisma.user.findUnique({
    where: { id: parentId, role: 'parent' },
    include: {
      students: true,
    },
  });
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
  return NextResponse.json({ parent, students: parent.students });
}

// PUT: Update parent profile or password
export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const body = await req.json();
    // Find school by code
    const school = await db.query.schools.findFirst({ where: eq(schools.code, schoolCode) });
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
    // Find parent by id (should be user id, email, or phone)
    const parent = await db.query.users.findFirst({
      where: and(eq(users.schoolId, school.id), eq(users.role, 'parent'),
        or(eq(users.email, body.parentId), eq(users.name, body.parentId))) // Adjust as needed
    });
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    // Update profile fields
    if (body.avatarUrl) {
      await db.update(users).set({ avatarUrl: body.avatarUrl, updatedAt: new Date() }).where(eq(users.id, parent.id));
    }
    // Update password
    if (body.oldPassword && body.newPassword) {
      // Check old password
      const valid = await bcrypt.compare(body.oldPassword, parent.password);
      if (!valid) return NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 });
      const hashed = await bcrypt.hash(body.newPassword, 12);
      await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, parent.id));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update parent' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const data = await req.json();
  // data: { name, email, phone, ... }
  const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

  // Use default parent password
  const hashedPassword = await hashDefaultPasswordByRole('parent');

  const parent = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: 'parent',
      schoolId: school.id,
    },
  });
  return NextResponse.json(parent);
} 