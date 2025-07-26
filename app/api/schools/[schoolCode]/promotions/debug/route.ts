import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  console.log('🔍 Debug endpoint called for school:', params.schoolCode);
  
  try {
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      return NextResponse.json({
        success: false,
        error: 'School not found'
      }, { status: 404 });
    }

    // Get all grades in the school
    const grades = await prisma.grade.findMany({
      where: { schoolId: school.id },
      include: {
        classes: {
          include: {
            students: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    // Get all students
    const students = await prisma.student.findMany({
      where: { 
        schoolId: school.id,
        isActive: true 
      },
      include: {
        user: true,
        class: {
          include: {
            grade: true
          }
        }
      }
    });

    console.log('📊 Debug data:', {
      school: school.name,
      gradesCount: grades.length,
      studentsCount: students.length
    });

    return NextResponse.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          code: school.code
        },
        grades: grades.map(grade => ({
          id: grade.id,
          name: grade.name,
          isAlumni: grade.isAlumni,
          classesCount: grade.classes.length,
          studentsCount: grade.classes.reduce((sum, cls) => sum + cls.students.length, 0)
        })),
        students: students.map(student => ({
          id: student.id,
          admissionNumber: student.admissionNumber,
          name: student.user.name,
          classId: student.classId,
          className: student.class?.name || 'No Class',
          gradeName: student.class?.grade?.name || 'No Grade',
          isActive: student.isActive
        }))
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 