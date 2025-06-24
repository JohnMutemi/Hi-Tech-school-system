import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Fetch fee structures for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { searchParams } = new URL(request.url);
    
    const term = searchParams.get('term');
    const year = searchParams.get('year');
    const classLevel = searchParams.get('classLevel');

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

    if (term) whereClause.term = term;
    if (year) whereClause.year = parseInt(year);
    if (classLevel) whereClause.classLevel = classLevel;

    // Fetch fee structures
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: whereClause,
      include: {
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
        }
      },
      orderBy: [
        { year: 'desc' },
        { term: 'asc' },
        { classLevel: 'asc' }
      ]
    });

    return NextResponse.json(feeStructures);
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
    
    const {
      term,
      year,
      classLevel,
      totalAmount,
      breakdown,
      isActive = true
    } = body;

    // Validate required fields
    if (!term || !year || !classLevel || !totalAmount || !breakdown) {
      return NextResponse.json(
        { error: 'Missing required fields: term, year, classLevel, totalAmount, breakdown' },
        { status: 400 }
      );
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
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

    // Check if a fee structure already exists for this term/year/classLevel
    const existingFeeStructure = await prisma.termlyFeeStructure.findFirst({
      where: {
        schoolId: school.id,
        term,
        year: parseInt(year),
        classLevel
      }
    });

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
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      action = 'updated';
    } else {
      // Create new fee structure
      feeStructure = await prisma.termlyFeeStructure.create({
        data: {
          term,
          year: parseInt(year),
          classLevel,
          totalAmount: parseFloat(totalAmount),
          breakdown,
          isActive,
          createdBy: adminUser.id,
          schoolId: school.id
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
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
          term,
          year: parseInt(year),
          classLevel,
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