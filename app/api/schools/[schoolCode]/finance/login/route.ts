import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { resolveFinanceGateForSchoolCode } from '@/lib/finance-package-gate';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'finance-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { email, password } = await request.json();
    const gate = await resolveFinanceGateForSchoolCode(schoolCode);

    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Finance module currently reuses bursar users for authentication.
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: 'bursar',
        schoolId: school.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const session = await getIronSession(cookies(), sessionOptions);
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      schoolCode,
    };
    await session.save();

    // Also establish the primary app session so shared school routes
    // (e.g. /api/schools/[schoolCode]/payments) can authorize finance users.
    const appSession = await getSession();
    appSession.isLoggedIn = true;
    appSession.id = user.id;
    appSession.email = user.email;
    appSession.name = user.name;
    appSession.role = user.role;
    appSession.schoolId = user.schoolId || undefined;
    await appSession.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
      },
    });
  } catch (error) {
    console.error('Finance login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
