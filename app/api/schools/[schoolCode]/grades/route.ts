import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all grades for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    const grades = await prisma.grade.findMany({ where: { schoolId: school.id } });
    return NextResponse.json(grades);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
} 