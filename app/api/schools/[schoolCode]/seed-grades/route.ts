import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    console.log('🌱 SEEDING GRADES API CALLED');
    console.log('School Code:', params.schoolCode);

    // 1. Find the school
    const school = await prisma.school.findFirst({
      where: { code: params.schoolCode }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    console.log('School found:', school.name);

    // 2. Check if grades already exist
    const existingGrades = await prisma.grade.findMany({
      where: { schoolId: school.id }
    });

    if (existingGrades.length > 0) {
      console.log('Grades already exist, returning existing grades');
      return NextResponse.json({
        success: true,
        message: 'Grades already exist',
        grades: existingGrades,
        existing: true
      });
    }

    // 3. Seed grades from Grade 1 to Grade 6
    console.log('Creating grades from Grade 1 to Grade 6...');
    const grades = [
      { name: 'Grade 1' },
      { name: 'Grade 2' },
      { name: 'Grade 3' },
      { name: 'Grade 4' },
      { name: 'Grade 5' },
      { name: 'Grade 6' }
    ];

    const createdGrades = [];

    for (const gradeData of grades) {
      try {
        const newGrade = await prisma.grade.create({
          data: {
            name: gradeData.name,
            schoolId: school.id,
            isAlumni: false
          }
        });

        createdGrades.push(newGrade);
        console.log(`Created grade: ${newGrade.name}`);
      } catch (error) {
        console.error(`Failed to create grade ${gradeData.name}:`, error);
        return NextResponse.json(
          { success: false, error: `Failed to create grade ${gradeData.name}` },
          { status: 500 }
        );
      }
    }

    console.log(`Successfully created ${createdGrades.length} grades`);

    return NextResponse.json({
      success: true,
      message: 'Grades seeded successfully',
      grades: createdGrades,
      summary: {
        gradesCreated: createdGrades.length,
        classesCreated: 0
      }
    });

  } catch (error) {
    console.error('Error seeding grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed grades' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    // 1. Find the school
    const school = await prisma.school.findFirst({
      where: { code: params.schoolCode }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // 2. Get existing grades
    const grades = await prisma.grade.findMany({
      where: { schoolId: school.id },
      include: {
        classes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            academicYear: true,
            isActive: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      grades: grades,
      summary: {
        totalGrades: grades.length,
        totalClasses: grades.reduce((sum, grade) => sum + grade.classes.length, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
} 