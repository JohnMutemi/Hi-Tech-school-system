import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { cloneScale } from '@/modules/grading-module/services/gradingScaleService';

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string; scaleId: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin', 'teacher']);

    const body = await request.json().catch(() => ({}));
    const cloned = await cloneScale(params.scaleId, schoolContext.schoolId, session.id, {
      name: body.name,
      isDefault: body.isDefault,
    });

    return NextResponse.json({ module: 'grading', data: cloned }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}
