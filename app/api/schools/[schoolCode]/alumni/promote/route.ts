import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateStudentEligibility, getBulkPromotionConfig } from '@/lib/services/bulk-promotion-service';

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

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        isCurrent: true
      }
    });

    if (!currentAcademicYear) {
      return NextResponse.json(
        { success: false, error: 'No current academic year found' },
        { status: 400 }
      );
    }

    // 1. Find the progression rule for Alumni
    const alumniProgression = await prisma.classProgression.findFirst({
      where: {
        schoolId: school.id,
        toClass: "Alumni",
        isActive: true,
        fromAcademicYear: currentAcademicYear.name
      }
    });

    if (!alumniProgression) {
      return NextResponse.json(
        { success: false, error: 'No progression rule to Alumni found' },
        { status: 400 }
      );
    }

    // 2. Find students in the fromClass/fromGrade
    const studentsToPromote = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        isActive: true,
        class: { name: alumniProgression.fromClass }
      },
      include: {
        user: true,
        class: true
      }
    });

    if (studentsToPromote.length === 0) {
      return NextResponse.json(
        {
          success: true,
          promotedCount: 0,
          graduationYear: currentAcademicYear.name,
          message: 'No students found to promote to alumni'
        }
      );
    }

    // 3. Check which students are already alumni
    const existingAlumni = await prisma.alumni.findMany({
      where: {
        schoolId: school.id,
        graduationYear: currentAcademicYear.name,
        studentId: {
          in: studentsToPromote.map(s => s.id)
        }
      }
    });

    const existingAlumniIds = existingAlumni.map(a => a.studentId);
    const notYetAlumni = studentsToPromote.filter(s => !existingAlumniIds.includes(s.id));

    if (notYetAlumni.length === 0) {
      return NextResponse.json(
        {
          success: true,
          promotedCount: 0,
          graduationYear: currentAcademicYear.name,
          message: 'All eligible students are already alumni'
        }
      );
    }

    // 4. Get promotion criteria for the school
    const promotionConfig = await getBulkPromotionConfig(params.schoolCode);
    if (!promotionConfig) {
      return NextResponse.json(
        { success: false, error: 'Promotion criteria not configured' },
        { status: 400 }
      );
    }

    // 5. Apply eligibility criteria
    const eligibleStudents = [];
    for (const student of notYetAlumni) {
      const eligibility = await calculateStudentEligibility(student.id, promotionConfig);
      if (eligibility.isEligible) eligibleStudents.push(student);
    }

    if (eligibleStudents.length === 0) {
      return NextResponse.json(
        {
          success: true,
          promotedCount: 0,
          graduationYear: currentAcademicYear.name,
          message: 'No eligible students to promote to alumni'
        }
      );
    }

    // 6. Promote eligible students to Alumni
    const alumniRecords = await Promise.all(
      eligibleStudents.map(async (student) => {
        // Calculate final grade (placeholder - can be enhanced later)
        const finalGrade = 'B'; // Or calculate from actual records

        // Create alumni record
        return prisma.alumni.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            graduationYear: currentAcademicYear.name,
            finalGrade,
            achievements: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      })
    );

    // 7. Update students to inactive (graduated)
    await prisma.student.updateMany({
      where: {
        id: {
          in: eligibleStudents.map(s => s.id)
        }
      },
      data: {
        isActive: false,
        status: 'graduated'
      }
    });

    // Optionally: log the promotion in PromotionLog

    return NextResponse.json({
      success: true,
      promotedCount: alumniRecords.length,
      graduationYear: currentAcademicYear.name,
      message: `Successfully promoted ${alumniRecords.length} students to alumni`
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