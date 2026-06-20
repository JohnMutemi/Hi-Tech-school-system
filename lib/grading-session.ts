import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export type GradingSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  schoolCode: string;
};

export type GradingSessionData = IronSession<{
  user?: GradingSessionUser;
}>;

export const gradingSessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'grading-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true,
    path: '/',
  },
};

export async function getGradingSession(): Promise<GradingSessionData> {
  return getIronSession(cookies(), gradingSessionOptions);
}
