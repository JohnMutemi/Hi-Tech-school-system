import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    console.log('🔍 POST /api/schools/[schoolCode]/alumni/promote called');
    console.log('📋 Params:', params);
    
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      console.log('❌ School not found:', params.schoolCode);
      return NextResponse.json(
        {
          success: false,
          error: 'School not found'
        },
        { status: 404 }
      );
    }

    console.log('✅ School found:', school.name);

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { 
        schoolId: school.id,
        isCurrent: true 
      }
    });

    if (!currentAcademicYear) {
      console.log('❌ No current academic year found');
      return NextResponse.json(
        {
          success: false,
          error: 'No current academic year found'
        },
        { status: 400 }
      );
    }

    const graduationYear = currentAcademicYear.name;
    console.log(`🎓 Promoting Grade 6 students for graduation year: ${graduationYear}`);

    // Find Grade 6 students who are active and not already alumni
    const grade6Students = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true,
        class: {
          name: {
            in: ['6A', 'Grade 6A', '6', 'Grade 6']
          }
        }
      },
      include: {
        user: true,
        class: true
      }
    });

    console.log(`📊 Found ${grade6Students.length} Grade 6 students`);

    if (grade6Students.length === 0) {
      return NextResponse.json(
        {
          success: true,
          promotedCount: 0,
          graduationYear,
          message: 'No Grade 6 students found to promote'
        }
      );
    }

    // Check which students are already alumni
    const existingAlumni = await prisma.alumni.findMany({
      where: {
        schoolId: school.id,
        graduationYear,
        studentId: {
          in: grade6Students.map(s => s.id)
        }
      }
    });

    const existingAlumniIds = existingAlumni.map(a => a.studentId);
    const studentsToPromote = grade6Students.filter(s => !existingAlumniIds.includes(s.id));

    console.log(`📊 ${studentsToPromote.length} students eligible for promotion`);

    if (studentsToPromote.length === 0) {
      return NextResponse.json(
        {
          success: true,
          promotedCount: 0,
          graduationYear,
          message: 'All Grade 6 students are already alumni'
        }
      );
    }

    // Create alumni records for eligible students
    const alumniRecords = await Promise.all(
      studentsToPromote.map(async (student) => {
        // Calculate final grade (placeholder - can be enhanced later)
        const finalGrade = 'B'; // Default grade, can be calculated from actual records
        
        // Create alumni record
        return prisma.alumni.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            graduationYear,
            finalGrade,
            achievements: [], // Empty array for now
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      })
    );

    // Update students to inactive (graduated)
    await prisma.student.updateMany({
      where: {
        id: {
          in: studentsToPromote.map(s => s.id)
        }
      },
      data: {
        isActive: false,
        status: 'graduated'
      }
    });

    console.log(`✅ Successfully promoted ${alumniRecords.length} students to alumni`);

    return NextResponse.json({
      success: true,
      promotedCount: alumniRecords.length,
      graduationYear,
      message: `Successfully promoted ${alumniRecords.length} Grade 6 students to alumni`
    });
  } catch (error) {
    console.error('❌ Error promoting students to alumni:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to promote students to alumni'
      },
      { status: 500 }
    );
  }
} 