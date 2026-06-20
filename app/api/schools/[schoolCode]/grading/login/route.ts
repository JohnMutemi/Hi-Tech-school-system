import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { gradingSessionOptions } from '@/lib/grading-session';

const GRADING_LOGIN_ROLES = ['teacher', 'school_admin'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolCode = String(params.schoolCode || '').trim();
    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const gate = await resolveGradingGateForSchoolCode(schoolCode);

    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        role: { in: [...GRADING_LOGIN_ROLES] },
        schoolId: gate.school.id,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await getIronSession(cookies(), gradingSessionOptions);
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      schoolCode: gate.school.code,
    };
    await session.save();

    const appSession = await getSession();
    appSession.isLoggedIn = true;
    appSession.id = user.id;
    appSession.email = user.email;
    appSession.name = user.name;
    appSession.role = user.role === 'admin' ? 'school_admin' : user.role;
    appSession.schoolId = user.schoolId || undefined;
    await appSession.save();

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      school: { id: gate.school.id, name: gate.school.name, code: gate.school.code },
    });
  } catch (error) {
    console.error('Grading login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
