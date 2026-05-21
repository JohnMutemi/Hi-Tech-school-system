import { NextRequest, NextResponse } from 'next/server';
import { getFinanceDashboardData } from '@/lib/services/finance-module-dashboard';
import { resolveFinanceGateForSchoolCode } from '@/lib/finance-package-gate';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; gradeId: string } }
) {
  try {
    const gate = await resolveFinanceGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    searchParams.set('gradeId', params.gradeId);
    const payload = await getFinanceDashboardData(params.schoolCode, searchParams);

    if (!payload) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({
      module: 'finance',
      scope: 'independent',
      gradeId: params.gradeId,
      ...payload,
    });
  } catch (error) {
    console.error('Error fetching finance dashboard by grade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
