import { NextRequest, NextResponse } from 'next/server';
import { getGradingSession } from '@/lib/grading-session';
import { getSession } from '@/lib/session';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';

export async function POST(
  _request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const session = await getGradingSession();
    session.destroy();

    const appSession = await getSession();
    appSession.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Grading logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
