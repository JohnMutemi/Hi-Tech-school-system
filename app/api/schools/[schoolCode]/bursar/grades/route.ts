import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;

    // Find the school by code
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Fetch all grades with their classes and student counts
    const grades = await prisma.grade.findMany({
      where: {
        schoolId: school.id,
      },
      include: {
        classes: {
          where: {
            isActive: true,
          },
          include: {
            _count: {
              select: {
                students: {
                  where: {
                    isActive: true,
                    status: 'active',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to include student counts
    const gradesWithCounts = grades.map(grade => ({
      id: grade.id,
      name: grade.name,
      isAlumni: grade.isAlumni,
      totalStudents: grade.classes.reduce((sum, cls) => sum + cls._count.students, 0),
      classes: grade.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        studentCount: cls._count.students,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: gradesWithCounts,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

