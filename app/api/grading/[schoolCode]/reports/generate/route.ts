import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { computeTermResults } from '@/modules/grading-module/services/gradingEngine';
import { generateBatchReportCards } from '@/modules/grading-module/services/reportGenerator';

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode, ['super_admin', 'school_admin', 'teacher']);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  const { classId, termId, computeFirst = true } = body;

  if (!classId || !termId) {
    return NextResponse.json({ error: 'classId and termId are required' }, { status: 400 });
  }

  try {
    if (computeFirst) {
      await computeTermResults(classId, termId);
    }

    const reports = await generateBatchReportCards(
      classId,
      termId,
      access.schoolContext.schoolId,
      access.session.id
    );

    return NextResponse.json({
      module: 'grading',
      success: true,
      count: reports.length,
      reportIds: reports.map((r) => r.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Report generation failed' },
      { status: 400 }
    );
  }
}
