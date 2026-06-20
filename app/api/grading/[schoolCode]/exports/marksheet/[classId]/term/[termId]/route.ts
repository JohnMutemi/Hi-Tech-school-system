import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { exportClassMarksheet } from '@/modules/grading-module/services/exportService';

type RouteParams = { params: { schoolCode: string; classId: string; termId: string } };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  try {
    const buffer = await exportClassMarksheet(
      params.classId,
      params.termId,
      access.schoolContext.schoolId
    );

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="marksheet-${params.classId}-${params.termId}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 400 }
    );
  }
}
