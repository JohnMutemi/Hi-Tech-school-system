import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const currentYear = new Date().getFullYear().toString();
    const createdClasses = [];
    const existingClasses = [];

    for (let i = 1; i <= 6; i++) {
      const className = `Grade ${i}`;
      
      const existingClass = await prisma.class.findFirst({
        where: {
          name: className,
          schoolId: school.id,
        },
      });

      if (existingClass) {
        existingClasses.push(className);
        continue;
      }

      const newClass = await prisma.class.create({
        data: {
          name: className,
          schoolId: school.id,
          academicYear: currentYear,
          level: 'Primary', // Defaulting to Primary, can be adjusted
        },
      });
      createdClasses.push(newClass);
    }

    return NextResponse.json({
      success: true,
      message: 'Default classes seeded successfully.',
      createdClasses,
      existingClasses,
    });

  } catch (error: any) {
    console.error('Failed to seed default classes:', error);
    return NextResponse.json({ error: 'Failed to seed default classes' }, { status: 500 });
  }
} 