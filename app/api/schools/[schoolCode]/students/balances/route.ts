import { NextRequest, NextResponse } from 'next/server';
import { getFinanceDashboardData } from '@/lib/services/finance-module-dashboard';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const payload = await getFinanceDashboardData(schoolCode, searchParams);

    if (!payload) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching students with fee balances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
