import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Find students who have alumni records but are still active
    const studentsWithAlumniRecords = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true,
        alumni: {
          some: {} // Has at least one alumni record
        }
      },
      include: {
        alumni: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (studentsWithAlumniRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No cleanup needed - all alumni students are properly marked as graduated',
        cleanedCount: 0
      });
    }

    // Update these students to be inactive and graduated
    await prisma.student.updateMany({
      where: {
        id: {
          in: studentsWithAlumniRecords.map(s => s.id)
        }
      },
      data: {
        isActive: false,
        status: 'graduated'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${studentsWithAlumniRecords.length} students who had alumni records but were still active`,
      cleanedCount: studentsWithAlumniRecords.length,
      cleanedStudents: studentsWithAlumniRecords.map(s => ({
        id: s.id,
        name: s.user.name,
        admissionNumber: s.admissionNumber,
        alumniCount: s.alumni.length
      }))
    });

  } catch (error) {
    console.error('Error cleaning up alumni students:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup alumni students'
      },
      { status: 500 }
    );
  }
} 