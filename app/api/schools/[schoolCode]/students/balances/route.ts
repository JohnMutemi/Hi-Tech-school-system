import { NextRequest, NextResponse } from 'next/server';
import { getFinanceDashboardData } from '@/lib/services/finance-module-dashboard';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const payload = await getFinanceDashboardData(schoolCode, {
      gradeId: searchParams.get('gradeId'),
      classId: searchParams.get('classId'),
      academicYear: searchParams.get('academicYear'),
      term: searchParams.get('term'),
      feeAccommodation: searchParams.get('feeAccommodation'),
    });

    if (!payload) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching students with fee balances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
