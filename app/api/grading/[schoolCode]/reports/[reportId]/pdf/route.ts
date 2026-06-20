import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { prisma } from '@/lib/prisma';
import { renderReportCardPdf } from '@/modules/grading-module/services/reportGenerator';

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string; reportId: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const report = await prisma.gradingModReportCard.findFirst({
    where: { id: params.reportId, schoolId: access.schoolContext.schoolId },
  });

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  try {
    const pdf = await renderReportCardPdf(
      report.studentId,
      report.termId,
      access.schoolContext.schoolId
    );

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 400 }
    );
  }
}
