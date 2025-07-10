import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const grades = [];
    for (let i = 1; i <= 6; i++) {
      const gradeName = `Grade ${i}`;
      let grade = await prisma.grade.findFirst({ where: { name: gradeName } });
      if (!grade) {
        grade = await prisma.grade.create({ data: { name: gradeName } });
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