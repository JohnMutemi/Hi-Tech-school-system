import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { listCloneablePresets } from '@/modules/grading-module/services/gradingScaleService';

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin', 'teacher']);

    const presets = await listCloneablePresets();

    return NextResponse.json({
      module: 'grading',
      scope: 'independent',
      data: presets,
    });
  } catch (error) {
    return jsonError(error);
  }
}
