import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import {
  getAssessmentScoreSheet,
  upsertAssessmentScores,
} from '@/modules/grading-module/services/scoreEntryService';

type RouteParams = { params: { schoolCode: string; assessmentId: string } };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const sheet = await getAssessmentScoreSheet(params.assessmentId, access.schoolContext.schoolId);
  if (!sheet) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  return NextResponse.json({ module: 'grading', data: sheet });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  const scores = Array.isArray(body.scores) ? body.scores : [];

  try {
    const result = await upsertAssessmentScores(
      params.assessmentId,
      access.schoolContext.schoolId,
      scores.map((entry: { studentId: string; rawScore: number | null; remarks?: string }) => ({
        studentId: entry.studentId,
        rawScore: entry.rawScore == null || entry.rawScore === '' ? null : Number(entry.rawScore),
        remarks: entry.remarks,
      })),
      access.session.id
    );

    const sheet = await getAssessmentScoreSheet(params.assessmentId, access.schoolContext.schoolId);
    return NextResponse.json({ module: 'grading', success: true, ...result, data: sheet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save scores' },
      { status: 400 }
    );
  }
}
