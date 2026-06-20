import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import {
  deleteScale,
  getScaleById,
  updateScale,
} from '@/modules/grading-module/services/gradingScaleService';

type RouteParams = { params: { schoolCode: string; scaleId: string } };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin', 'teacher']);

    const scale = await getScaleById(params.scaleId, schoolContext.schoolId);
    if (!scale) {
      return NextResponse.json({ error: 'Grading scale not found' }, { status: 404 });
    }

    return NextResponse.json({ module: 'grading', data: scale });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin']);

    const body = await request.json();
    const updated = await updateScale(params.scaleId, schoolContext.schoolId, {
      name: body.name,
      curriculum: body.curriculum,
      level: body.level,
      isDefault: body.isDefault,
      bands: body.bands,
    });

    return NextResponse.json({ module: 'grading', data: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ['super_admin', 'school_admin']);

    await deleteScale(params.scaleId, schoolContext.schoolId);
    return NextResponse.json({ module: 'grading', success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}
