import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    console.log('🔍 GET /api/schools/[schoolCode]/promotions/history called');
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

    // Get promotion history for the school
    const promotionHistory = await prisma.promotionLog.findMany({
      where: {
        student: {
          schoolId: school.id
        }
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 promotions
    });

    console.log(`📊 Found ${promotionHistory.length} promotion records`);

    const formattedHistory = promotionHistory.map(record => ({
      id: record.id,
      studentName: record.student.user.name,
      fromClass: record.fromClass,
      toClass: record.toClass,
      fromGrade: record.fromGrade,
      toGrade: record.toGrade,
      fromYear: record.fromYear,
      toYear: record.toYear,
      promotedBy: record.promotedBy,
      promotionType: record.promotionType,
      averageGrade: record.averageGrade,
      outstandingBalance: record.outstandingBalance,
      disciplinaryCases: record.disciplinaryCases,
      createdAt: record.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: formattedHistory
    });
  } catch (error) {
    console.error('❌ Error getting promotion history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get promotion history'
      },
      { status: 500 }
    );
  }
} 