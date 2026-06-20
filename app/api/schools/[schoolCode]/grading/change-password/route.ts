import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { getGradingSession } from '@/lib/grading-session';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const GRADING_LOGIN_ROLES = ['teacher', 'school_admin'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolCode = String(params.schoolCode || '').trim();
    const gate = await resolveGradingGateForSchoolCode(schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const session = await getGradingSession();
    if (!session.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userSchoolId = session.user.schoolId;
    const sessionCode = String(session.user.schoolCode || '').trim().toLowerCase();
    const urlCode = schoolCode.toLowerCase();
    const schoolMatches =
      userSchoolId === gate.school.id || (sessionCode !== '' && sessionCode === urlCode);
    if (!schoolMatches) {
      return NextResponse.json({ error: 'Invalid school access' }, { status: 403 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();
    const cur = String(currentPassword || '');
    const next = String(newPassword || '');
    const conf = String(confirmPassword || '');

    if (!cur || !next) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }
    if (next.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }
    if (next !== conf) {
      return NextResponse.json({ error: 'New password and confirmation do not match.' }, { status: 400 });
    }
    if (next === cur) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        schoolId: gate.school.id,
        role: { in: [...GRADING_LOGIN_ROLES] },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const ok = await bcrypt.compare(cur, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const hashed = await bcrypt.hash(next, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        mustChangePassword: false,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    session.destroy();
    const appSession = await getSession();
    appSession.destroy();

    return NextResponse.json({
      success: true,
      message: 'Password updated. Sign in again with your new password.',
    });
  } catch (error) {
    console.error('Grading change-password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
