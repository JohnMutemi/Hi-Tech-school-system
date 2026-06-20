import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import {
  enrollStudentInLegacyClass,
  listLegacyRosterStudents,
} from '@/modules/grading-module/services/rosterService';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const legacyClassId = new URL(request.url).searchParams.get('legacyClassId')?.trim();
  if (!legacyClassId) {
    return NextResponse.json({ error: 'legacyClassId is required' }, { status: 400 });
  }

  try {
    const data = await listLegacyRosterStudents(access.schoolContext.schoolId, legacyClassId);
    return NextResponse.json({ module: 'grading', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load roster';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode, [
    'super_admin',
    'school_admin',
    'teacher',
  ]);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  try {
    const student = await enrollStudentInLegacyClass(
      access.schoolContext.schoolId,
      params.schoolCode,
      {
        name: String(body.name || ''),
        admissionNumber: String(body.admissionNumber || ''),
        legacyClassId: String(body.legacyClassId || ''),
        parentName: String(body.parentName || 'Parent/Guardian'),
        parentPhone: String(body.parentPhone || ''),
        gender: body.gender ? String(body.gender) : undefined,
      }
    );
    return NextResponse.json({ module: 'grading', data: student }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enroll student';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
