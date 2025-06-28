import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const school = await prisma.school.findUnique({ where: { code: schoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    const grades = [];
    for (let i = 1; i <= 8; i++) {
      const gradeName = `Grade ${i}`;
      let grade = await prisma.grade.findFirst({ where: { name: gradeName, schoolId: school.id } });
      if (!grade) {
        grade = await prisma.grade.create({ data: { name: gradeName, schoolId: school.id } });
        grades.push(grade);
      } else {
        grades.push(grade);
      }
    }
    return NextResponse.json({ success: true, grades });
  } catch (error: any) {
    console.error('Failed to seed grades:', error);
    return NextResponse.json({ error: 'Failed to seed grades' }, { status: 500 });
  }
} 