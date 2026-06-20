import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGradingSession } from '@/lib/grading-session';
import { normalizePackageType, resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';

export async function GET(
  _request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const session = await getGradingSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionCode = String(session.user.schoolCode || '').trim().toLowerCase();
    const urlCode = String(params.schoolCode || '').trim().toLowerCase();
    const schoolMatches =
      session.user.schoolId === gate.school.id ||
      (sessionCode !== '' && sessionCode === urlCode);

    if (!schoolMatches) {
      return NextResponse.json({ error: 'Invalid school access' }, { status: 403 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });

    const pkg = normalizePackageType(gate.school.packageType);
    const requiresInitialPasswordChange =
      (pkg === 'grading_only' || pkg === 'finance_grading') &&
      Boolean(dbUser?.mustChangePassword);

    return NextResponse.json({
      success: true,
      user: session.user,
      requiresInitialPasswordChange,
      packageType: normalizePackageType(gate.school.packageType),
    });
  } catch (error) {
    console.error('Grading session check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
