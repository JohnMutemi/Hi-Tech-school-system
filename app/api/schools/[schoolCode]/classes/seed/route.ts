import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GRADE_NAMES } from '@/lib/default-school-structure';

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

    const createdClasses = [];
    const existingClasses = [];

    for (const className of DEFAULT_GRADE_NAMES) {
      let grade = await prisma.grade.findFirst({
        where: {
          schoolId: school.id,
          name: className,
        },
      });

      if (!grade) {
        grade = await prisma.grade.create({
          data: {
            schoolId: school.id,
            name: className,
            isAlumni: false,
          },
        });
      }
      
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
          gradeId: grade.id,
          isActive: true,
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