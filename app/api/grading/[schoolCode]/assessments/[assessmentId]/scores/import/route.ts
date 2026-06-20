import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { getAssessmentScoreSheet } from '@/modules/grading-module/services/scoreEntryService';
import { importScoresFromCsv } from '@/modules/grading-module/services/csvScoreImportService';

type RouteParams = { params: { schoolCode: string; assessmentId: string } };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  const csvText = String(body.csv ?? body.csvText ?? '');
  if (!csvText.trim()) {
    return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
  }

  try {
    const result = await importScoresFromCsv(
      params.assessmentId,
      access.schoolContext.schoolId,
      csvText,
      access.session.id
    );
    const sheet = await getAssessmentScoreSheet(params.assessmentId, access.schoolContext.schoolId);
    return NextResponse.json({ module: 'grading', success: true, ...result, data: sheet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CSV import failed' },
      { status: 400 }
    );
  }
}
