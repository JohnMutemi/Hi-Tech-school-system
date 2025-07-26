import { NextRequest, NextResponse } from 'next/server';
import { getEligibleStudents } from '@/lib/services/bulk-promotion-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    console.log('🔍 GET /api/schools/[schoolCode]/promotions/bulk/eligible called');
    console.log('📋 Params:', params);
    
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    
    // Get the active criteria for this school
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

    // Get active criteria
    const activeCriteria = await prisma.promotionCriteria.findFirst({
      where: { 
        schoolId: school.id,
        promotionType: "bulk",
        isActive: true
      }
    });

    if (!activeCriteria) {
      console.log('❌ No active criteria found for school:', params.schoolCode);
      return NextResponse.json(
        {
          success: false,
          error: 'No active promotion criteria found. Please configure criteria first.'
        },
        { status: 400 }
      );
    }

    const criteria = {
      minGrade: activeCriteria.minGrade,
      maxFeeBalance: activeCriteria.maxFeeBalance,
      maxDisciplinaryCases: activeCriteria.maxDisciplinaryCases || 0
    };

    console.log('📋 Using criteria:', criteria);

    const eligibleStudents = await getEligibleStudents(params.schoolCode, criteria, academicYearId || undefined);

    return NextResponse.json({
      success: true,
      data: eligibleStudents,
      criteria
    });
  } catch (error) {
    console.error('Error getting eligible students:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get eligible students'
      },
      { status: 500 }
    );
  }
} 