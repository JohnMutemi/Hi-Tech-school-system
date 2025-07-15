import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { PromotionService } from '@/lib/services/promotion-service';

const prisma = new PrismaClient();

// POST: Execute bulk promotion
export async function POST(
  request: NextRequest, 
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const body = await request.json();
    const { students, promotedBy } = body;

    // Validate required fields
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'Students array is required' },
        { status: 400 }
      );
    }
    if (!promotedBy) {
      return NextResponse.json(
        { error: 'Promoted by user ID is required' },
        { status: 400 }
      );
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Execute bulk promotion
    const result = await PromotionService.bulkPromoteStudents(
      school.id,
      students,
      promotedBy
    );

    // Set the new academic year and term as active
    const currentYear = new Date().getFullYear();
    const newAcademicYearName = (currentYear + 1).toString();
    // Find or create the new academic year
    let newAcademicYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, name: newAcademicYearName }
    });
    if (!newAcademicYear) {
      newAcademicYear = await prisma.academicYear.create({
        data: {
          schoolId: school.id,
          name: newAcademicYearName,
          startDate: new Date(currentYear + 1, 0, 1),
          endDate: new Date(currentYear + 1, 11, 31),
          isCurrent: false
        }
      });
    }
    // Set all years to not current, then set the new one as current
    await prisma.academicYear.updateMany({
      where: { schoolId: school.id },
      data: { isCurrent: false }
    });
    await prisma.academicYear.update({
      where: { id: newAcademicYear.id },
      data: { isCurrent: true }
    });
    // Set the new term as current (assume 'Term 1')
    let newTerm = await prisma.term.findFirst({
      where: { academicYearId: newAcademicYear.id, name: 'Term 1' }
    });
    if (newTerm) {
      await prisma.term.updateMany({
        where: { academicYearId: newAcademicYear.id },
        data: { isCurrent: false }
      });
      await prisma.term.update({
        where: { id: newTerm.id },
        data: { isCurrent: true }
      });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Bulk promotion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute bulk promotion' },
      { status: 500 }
    );
  }
}

// GET: Get promotion preview
export async function GET(
  request: NextRequest, 
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const currentYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const studentIds = searchParams.get('studentIds')?.split(',') || [];

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    if (studentIds.length === 0) {
      // Get all eligible students
      const eligibleStudents = await PromotionService.getEligibleStudents(school.id, currentYear);
      return NextResponse.json({
        eligibleStudents: eligibleStudents.map(student => ({
          id: student.id,
          name: student.user.name,
          admissionNumber: student.admissionNumber,
          currentClass: student.class?.name || 'Unassigned',
          currentGrade: student.class?.grade?.name || 'Unassigned',
          teacher: student.class?.teacher?.name || 'Unassigned'
        }))
      });
    } else {
      // Get promotion preview for selected students
      const promotionList = await PromotionService.getFinalPromotionList(
        school.id,
        currentYear,
        studentIds
      );

      return NextResponse.json({
        promotionList,
        summary: {
          total: promotionList.length,
          graduating: promotionList.filter(p => p.isGraduating).length,
          promoting: promotionList.filter(p => !p.isGraduating && p.toClass !== 'No Next Class').length,
          excluded: promotionList.filter(p => p.toClass === 'No Next Class').length
        }
      });
    }

  } catch (error: any) {
    console.error('Promotion preview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get promotion preview' },
      { status: 500 }
    );
  }
} 