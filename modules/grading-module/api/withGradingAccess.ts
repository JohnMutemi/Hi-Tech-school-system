import { NextResponse } from 'next/server';
import { requireRole, requireSchoolAccess, jsonError } from '@/lib/api-guard';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';

export async function withGradingApiAccess(
  schoolCode: string,
  roles: Array<'super_admin' | 'school_admin' | 'teacher'> = [
    'super_admin',
    'school_admin',
    'teacher',
  ]
) {
  const gate = await resolveGradingGateForSchoolCode(schoolCode);
  if (!gate.ok) {
    return { error: NextResponse.json({ error: gate.error }, { status: gate.status }) };
  }

  try {
    const access = await requireSchoolAccess(schoolCode);
    requireRole(access.session, roles);
    return { gate, ...access };
  } catch (error) {
    return { error: jsonError(error) };
  }
}
