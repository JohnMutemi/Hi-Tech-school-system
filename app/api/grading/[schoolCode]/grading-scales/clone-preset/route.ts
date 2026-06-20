import { NextRequest, NextResponse } from 'next/server';
import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';
import { clonePresetByKey } from '@/modules/grading-module/services/gradingScaleService';

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  const access = await withGradingApiAccess(params.schoolCode, [
    'super_admin',
    'school_admin',
    'teacher',
  ]);
  if ('error' in access && access.error) return access.error;

  const body = await request.json().catch(() => ({}));
  const presetKey = String(body.presetKey || '').trim();
  if (!presetKey) {
    return NextResponse.json({ error: 'presetKey is required' }, { status: 400 });
  }

  try {
    const cloned = await clonePresetByKey(
      presetKey,
      access.schoolContext.schoolId,
      access.session.id,
      {
        name: body.name ? String(body.name) : undefined,
        isDefault: Boolean(body.isDefault),
      }
    );
    return NextResponse.json({ module: 'grading', data: cloned }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clone failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
