import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { setDefaultScale } from '@/modules/grading-module/services/gradingScaleService';

export async function POST(
  _request: NextRequest,
  { params }: { params: { schoolCode: string; scaleId: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin', 'teacher']);

    const scale = await setDefaultScale(params.scaleId, schoolContext.schoolId);
    return NextResponse.json({ module: 'grading', data: scale });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}
