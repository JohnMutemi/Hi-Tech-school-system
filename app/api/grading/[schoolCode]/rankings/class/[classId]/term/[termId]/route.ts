import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { getClassRankings, getClassAnalyticsSummary } from '@/modules/grading-module/services/rankingService';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; classId: string; termId: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const includeSummary = searchParams.get('summary') === '1';

  try {
    const rankings = await getClassRankings(
      params.classId,
      params.termId,
      access.schoolContext.schoolId
    );
    const summary = includeSummary
      ? await getClassAnalyticsSummary(params.classId, params.termId, access.schoolContext.schoolId)
      : undefined;

    return NextResponse.json({ module: 'grading', data: rankings, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load rankings' },
      { status: 400 }
    );
  }
}
