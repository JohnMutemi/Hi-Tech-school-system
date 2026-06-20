import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import {
  buildReportCardData,
  renderReportCardPdf,
} from '@/modules/grading-module/services/reportGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const termId = searchParams.get('termId');

  if (!studentId || !termId) {
    return NextResponse.json({ error: 'studentId and termId required' }, { status: 400 });
  }

  try {
    const data = await buildReportCardData(studentId, termId, access.schoolContext.schoolId);
    return NextResponse.json({ module: 'grading', data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load report' },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const body = await request.json();
  const { studentId, termId, download } = body;

  if (!studentId || !termId) {
    return NextResponse.json({ error: 'studentId and termId required' }, { status: 400 });
  }

  try {
    if (download) {
      const pdf = await renderReportCardPdf(studentId, termId, access.schoolContext.schoolId);
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${studentId}.pdf"`,
        },
      });
    }

    const data = await buildReportCardData(studentId, termId, access.schoolContext.schoolId);
    return NextResponse.json({ module: 'grading', data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 400 }
    );
  }
}
