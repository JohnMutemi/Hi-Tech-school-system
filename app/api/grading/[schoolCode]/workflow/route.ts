import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { getGradingWorkflowSnapshot } from '@/modules/grading-module/services/workflowService';

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode);
  if ('error' in access && access.error) return access.error;

  const data = await getGradingWorkflowSnapshot(access.schoolContext.schoolId);
  return NextResponse.json({ module: 'grading', data });
}
