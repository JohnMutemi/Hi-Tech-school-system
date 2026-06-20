import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import {
  getPerformanceReviewBoard,
  savePerformanceReviewScores,
} from '@/modules/grading-module/services/performanceReviewService';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId')?.trim();
  const termId = searchParams.get('termId')?.trim();

  if (!classId || !termId) {
    return NextResponse.json({ error: 'classId and termId are required' }, { status: 400 });
  }

  try {
    const data = await getPerformanceReviewBoard(access.schoolContext.schoolId, classId, termId);
    return NextResponse.json({ module: 'grading', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load performance review';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  const classId = String(body.classId || '').trim();
  const termId = String(body.termId || '').trim();
  const entries = Array.isArray(body.entries) ? body.entries : [];

  if (!classId || !termId) {
    return NextResponse.json({ error: 'classId and termId are required' }, { status: 400 });
  }

  try {
    const data = await savePerformanceReviewScores(
      access.schoolContext.schoolId,
      classId,
      termId,
      entries.map((entry: { studentId: string; subjectId: string; rawScore: number | null }) => ({
        studentId: String(entry.studentId),
        subjectId: String(entry.subjectId),
        rawScore:
          entry.rawScore === null || entry.rawScore === undefined || entry.rawScore === ''
            ? null
            : Number(entry.rawScore),
      })),
      access.session.id
    );
    return NextResponse.json({ module: 'grading', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save performance scores';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
