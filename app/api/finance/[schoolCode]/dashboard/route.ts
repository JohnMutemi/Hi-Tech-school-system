import { NextRequest, NextResponse } from 'next/server';
import { getFinanceDashboardData } from '@/lib/services/finance-module-dashboard';
import { resolveFinanceGateForSchoolCode } from '@/lib/finance-package-gate';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveFinanceGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const payload = await getFinanceDashboardData(params.schoolCode, {
      gradeId: searchParams.get('gradeId'),
      classId: searchParams.get('classId'),
      academicYear: searchParams.get('academicYear'),
      term: searchParams.get('term'),
    });

    if (!payload) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({
      module: 'finance',
      scope: 'independent',
      ...payload,
    });
  } catch (error) {
    console.error('Error fetching finance module dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
