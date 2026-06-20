import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { listStudentReports } from '@/modules/grading-module/services/reportGenerator';

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const reports = await listStudentReports(params.studentId, access.schoolContext.schoolId);
  return NextResponse.json({ module: 'grading', data: reports });
}
