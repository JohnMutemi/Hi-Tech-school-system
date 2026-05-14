import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { normalizePackageType, resolveFinanceGateForSchoolCode } from '@/lib/finance-package-gate';
import { prisma } from '@/lib/prisma';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'finance-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true,
    path: '/',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const gate = await resolveFinanceGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const session = await getIronSession(cookies(), sessionOptions);

    if (!session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userSchoolId = session.user.schoolId;
    const sessionCode = String(session.user.schoolCode || '').trim().toLowerCase();
    const urlCode = String(params.schoolCode || '').trim().toLowerCase();
    const schoolMatches =
      userSchoolId === gate.school.id ||
      (sessionCode !== '' && sessionCode === urlCode);

    if (!schoolMatches) {
      return NextResponse.json(
        { error: 'Invalid school access' },
        { status: 403 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });

    const requiresInitialPasswordChange =
      normalizePackageType(gate.school.packageType) === 'finance_only' &&
      Boolean(dbUser?.mustChangePassword);

    return NextResponse.json({
      success: true,
      user: session.user,
      requiresInitialPasswordChange,
      packageType: normalizePackageType(gate.school.packageType),
    });
  } catch (error) {
    console.error('Finance session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
