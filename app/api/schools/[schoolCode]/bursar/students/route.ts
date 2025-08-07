import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { feeBalanceService } from '@/lib/services/fee-balance-service';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    const classId = searchParams.get('classId');
    const academicYear = searchParams.get('academicYear') || new Date().getFullYear().toString();
    const term = searchParams.get('term') || 'FIRST';

    // Find the school by code
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Use the fee balance service to get real-time balances
    const balanceData = await feeBalanceService.getSchoolStudentBalances(
      school.id,
      academicYear,
      term,
      gradeId || undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        students: balanceData.students,
        academicYear,
        term,
        summary: balanceData.summary,
      },
    });
  } catch (error) {
    console.error('Error fetching students with fee balances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
