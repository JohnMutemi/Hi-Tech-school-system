import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import {
  createScale,
  listScalesForSchool,
} from '@/modules/grading-module/services/gradingScaleService';

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin', 'teacher']);

    const scales = await listScalesForSchool(schoolContext.schoolId);

    return NextResponse.json({
      module: 'grading',
      scope: 'independent',
      data: scales,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin']);

    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Scale name is required' }, { status: 400 });
    }

    if (!Array.isArray(body.bands) || body.bands.length === 0) {
      return NextResponse.json({ error: 'At least one band is required' }, { status: 400 });
    }

    const created = await createScale(schoolContext.schoolId, {
      name,
      curriculum: String(body.curriculum || 'CUSTOM'),
      level: String(body.level || 'upper_primary'),
      isDefault: Boolean(body.isDefault),
      createdBy: session.id,
      bands: body.bands,
    });

    return NextResponse.json({ module: 'grading', data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}
