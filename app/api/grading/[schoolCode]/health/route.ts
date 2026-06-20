import { NextResponse } from 'next/server';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { listSystemPresets } from '@/modules/grading-module/services/gradingScaleService';

export async function GET(
  _request: Request,
  { params }: { params: { schoolCode: string } }
) {
  const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const presets = await listSystemPresets();

  return NextResponse.json({
    module: 'grading',
    scope: 'independent',
    status: 'ok',
    schoolCode: gate.school.code,
    presetCount: presets.length,
    tables: 'grading_mod_*',
    legacyGradingUntouched: true,
  });
}
