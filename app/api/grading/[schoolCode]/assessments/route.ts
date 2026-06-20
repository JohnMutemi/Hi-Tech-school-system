import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import {
  createAssessment,
  listAssessments,
} from '@/modules/grading-module/services/scoreEntryService';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const data = await listAssessments(access.schoolContext.schoolId, {
    classId: searchParams.get('classId') ?? undefined,
    subjectId: searchParams.get('subjectId') ?? undefined,
    termId: searchParams.get('termId') ?? undefined,
  });

  return NextResponse.json({ module: 'grading', data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Assessment name is required' }, { status: 400 });
  }

  if (!body.classId || !body.subjectId || !body.termId || !body.assessmentTypeId) {
    return NextResponse.json({ error: 'classId, subjectId, termId, assessmentTypeId required' }, { status: 400 });
  }

  const created = await createAssessment(access.schoolContext.schoolId, {
    classId: body.classId,
    subjectId: body.subjectId,
    termId: body.termId,
    assessmentTypeId: body.assessmentTypeId,
    name,
    maxScore: body.maxScore != null ? Number(body.maxScore) : 100,
    dateAdministered: body.dateAdministered ? new Date(body.dateAdministered) : null,
    createdBy: access.session.id,
  });

  return NextResponse.json({ module: 'grading', data: created }, { status: 201 });
}
