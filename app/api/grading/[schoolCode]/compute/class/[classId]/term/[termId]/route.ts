import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { computeTermResults } from '@/modules/grading-module/services/gradingEngine';

export async function POST(
  _request: NextRequest,
  { params }: { params: { schoolCode: string; classId: string; termId: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin', 'teacher']);

    await computeTermResults(params.classId, params.termId);

    return NextResponse.json({
      module: 'grading',
      scope: 'independent',
      success: true,
      classId: params.classId,
      termId: params.termId,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}
