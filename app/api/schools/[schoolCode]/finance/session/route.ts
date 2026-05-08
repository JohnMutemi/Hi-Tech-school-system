import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { resolveFinanceGateForSchoolCode } from '@/lib/finance-package-gate';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'finance-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
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

    if (session.user.schoolCode !== params.schoolCode) {
      return NextResponse.json(
        { error: 'Invalid school access' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session.user,
    });
  } catch (error) {
    console.error('Finance session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
