import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Fetch fee structures for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { searchParams } = new URL(request.url);
    
    const termId = searchParams.get('termId');
    const academicYearId = searchParams.get('academicYearId');
    const term = searchParams.get('term');
    const year = searchParams.get('year');
    const gradeId = searchParams.get('gradeId');

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Build query filters
    const whereClause: any = {
      schoolId: school.id,
      isActive: true
    };
    if (academicYearId) whereClause.academicYearId = academicYearId;
    if (termId) whereClause.termId = termId;
    if (gradeId) whereClause.gradeId = gradeId;
    // Legacy support
    if (!termId && term) whereClause.term = term;
    if (!academicYearId && year) whereClause.year = parseInt(year);

    // Fetch fee structures
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: whereClause,
      include: {
        grade: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        logs: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 5,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        academicYear: true,
        termRef: true,
      },
      orderBy: [
        { year: 'desc' },
        { term: 'asc' }
      ]
    });

    // Add gradeName to each fee structure for display
    const feeStructuresWithGrade = feeStructures.map(fee => ({
      ...fee,
      gradeName: fee.grade?.name || ''
    }));

    return NextResponse.json(feeStructuresWithGrade);
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
  }
}

// POST: Create or update a fee structure
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const body = await request.json();
    
    let {
      term,
      year,
      gradeId,
      totalAmount,
      breakdown,
      isActive = true,
      academicYearId,
      termId
    } = body;

    // Accept breakdown as array of { name, value }
    if (!Array.isArray(breakdown)) {
      // fallback: convert object to array
      breakdown = Object.entries(breakdown || {}).map(([name, value]) => ({ name, value: parseFloat(value) || 0 }));
    }
    // Calculate total from breakdown if not provided or mismatched
    const calcTotal = breakdown.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    if (!totalAmount || Math.abs(calcTotal - parseFloat(totalAmount)) > 0.01) {
      totalAmount = calcTotal;
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // If academicYearId/termId not provided, get current
    if (!academicYearId || !termId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId: school.id, isCurrent: true },
      });
      if (currentYear) {
        if (!academicYearId) academicYearId = currentYear.id;
        if (!termId) {
          const currentTerm = await prisma.term.findFirst({
            where: { academicYearId: currentYear.id, isCurrent: true },
          });
          if (currentTerm) termId = currentTerm.id;
        }
      }
    }

    // If term is not provided but termId is, fetch the term name
    if (!term && termId) {
      const termObj = await prisma.term.findUnique({ where: { id: termId } });
      if (termObj) {
        term = termObj.name;
      }
    }

    // For now, we'll use a default admin user ID
    // In a real app, you'd get this from the authenticated session
    const adminUser = await prisma.user.findFirst({
      where: {
        schoolId: school.id,
        role: 'admin'
      }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'No admin user found for this school' }, { status: 404 });
    }

    // Validate required fields
    if (!gradeId || !totalAmount || !breakdown) {
      return NextResponse.json(
        { error: 'Missing required fields: gradeId, totalAmount, breakdown' },
        { status: 400 }
      );
    }
    // At least one of academicYearId/year and termId/term must be present
    if (!(academicYearId || year) || !(termId || term)) {
      return NextResponse.json(
        { error: 'Missing required fields: academicYearId or year, and termId or term' },
        { status: 400 }
      );
    }

    // Check if a fee structure already exists for this term/year/gradeId (new logic first)
    let existingFeeStructure = null;
    if (academicYearId && termId) {
      existingFeeStructure = await prisma.termlyFeeStructure.findFirst({
        where: {
          schoolId: school.id,
          academicYearId,
          termId,
          gradeId
        }
      });
    }
    // Fallback to legacy check
    if (!existingFeeStructure && year && term) {
      existingFeeStructure = await prisma.termlyFeeStructure.findFirst({
        where: {
          schoolId: school.id,
          year: parseInt(year),
          term,
          gradeId
        }
      });
    }

    let feeStructure;
    let action = 'created';

    if (existingFeeStructure) {
      // Update existing fee structure
      feeStructure = await prisma.termlyFeeStructure.update({
        where: { id: existingFeeStructure.id },
        data: {
          totalAmount: parseFloat(totalAmount),
          breakdown,
          isActive,
          updatedAt: new Date(),
          academicYearId: academicYearId || undefined,
          termId: termId || undefined,
        },
        include: {
          grade: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          academicYear: true,
          termRef: true,
        }
      });
      action = 'updated';
    } else {
      // Create new fee structure
      feeStructure = await prisma.termlyFeeStructure.create({
        data: {
          term: term || undefined,
          year: year ? parseInt(year) : undefined,
          gradeId,
          totalAmount: parseFloat(totalAmount),
          breakdown,
          isActive,
          createdBy: adminUser.id,
          schoolId: school.id,
          academicYearId: academicYearId || undefined,
          termId: termId || undefined,
        },
        include: {
          grade: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          academicYear: true,
          termRef: true,
        }
      });
    }

    // Log the action
    await prisma.feeStructureLog.create({
      data: {
        feeStructureId: feeStructure.id,
        action,
        performedBy: adminUser.id,
        details: {
          term: term || feeStructure.termRef?.name,
          year: year || feeStructure.academicYear?.name,
          gradeId,
          totalAmount: parseFloat(totalAmount),
          breakdown
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Fee structure ${action} successfully`,
      feeStructure
    }, { status: existingFeeStructure ? 200 : 201 });

  } catch (error) {
    console.error('Error creating/updating fee structure:', error);
    return NextResponse.json({ error: 'Failed to create/update fee structure' }, { status: 500 });
  }
} 