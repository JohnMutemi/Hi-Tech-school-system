import { verify } from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { withSchoolContext } from '@/lib/school-context';
import { prisma } from '@/lib/prisma';

export type PortalFeeAuth =
  | { kind: 'staff'; role: string; userId: string; schoolId: string }
  | { kind: 'parent'; userId: string; schoolId: string }
  | { kind: 'student'; studentId: string; schoolId: string };

const STAFF_FEE_ROLES = new Set(['school_admin', 'bursar']);

/**
 * Resolves the caller for fee/receipt APIs: iron-session staff, parent JWT, or student JWT.
 */
export async function resolvePortalFeeAuth(
  request: NextRequest,
  schoolCode: string
): Promise<PortalFeeAuth | null> {
  let normalized = schoolCode;
  try {
    normalized = decodeURIComponent(schoolCode).toLowerCase();
  } catch {
    normalized = schoolCode.toLowerCase();
  }

  try {
    const session = await getSession();
    if (session?.isLoggedIn) {
      const schoolManager = withSchoolContext(schoolCode);
      const schoolContext = await schoolManager.initialize();
      if (session.role === 'super_admin') {
        return {
          kind: 'staff',
          role: 'super_admin',
          userId: session.id,
          schoolId: schoolContext.schoolId,
        };
      }
      if (session.schoolId && session.schoolId === schoolContext.schoolId && session.role) {
        return {
          kind: 'staff',
          role: session.role,
          userId: session.id,
          schoolId: schoolContext.schoolId,
        };
      }
    }
  } catch {
    /* iron-session */
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const parentToken = request.cookies.get('parent_auth_token')?.value;
  if (parentToken) {
    try {
      const p = verify(parentToken, secret) as {
        userId?: string;
        role?: string;
        schoolCode?: string;
        schoolId?: string;
      };
      if (
        p.role === 'parent' &&
        p.userId &&
        p.schoolId &&
        String(p.schoolCode || '').toLowerCase() === normalized
      ) {
        return { kind: 'parent', userId: p.userId, schoolId: p.schoolId };
      }
    } catch {
      /* invalid */
    }
  }

  const studentToken = request.cookies.get('student_auth_token')?.value;
  if (studentToken) {
    try {
      const s = verify(studentToken, secret) as {
        studentId?: string;
        role?: string;
        schoolCode?: string;
      };
      if (s.role === 'student' && s.studentId && String(s.schoolCode || '').toLowerCase() === normalized) {
        const st = await prisma.student.findFirst({
          where: {
            id: s.studentId,
            school: { code: { equals: normalized, mode: 'insensitive' } },
          },
          select: { schoolId: true },
        });
        if (st) {
          return { kind: 'student', studentId: s.studentId, schoolId: st.schoolId };
        }
      }
    } catch {
      /* invalid */
    }
  }

  return null;
}

export async function assertStudentFeeAccess(
  auth: PortalFeeAuth | null,
  schoolId: string,
  studentId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!auth) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true, parentId: true },
  });
  if (!student) {
    return { ok: false, status: 404, message: 'Student not found' };
  }

  if (auth.kind === 'staff') {
    if (auth.role === 'super_admin') return { ok: true };
    if (STAFF_FEE_ROLES.has(auth.role) && auth.schoolId === schoolId) return { ok: true };
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  if (auth.kind === 'parent') {
    if (auth.schoolId !== schoolId) return { ok: false, status: 403, message: 'Forbidden' };
    if (student.parentId === auth.userId) return { ok: true };
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  if (auth.kind === 'student') {
    if (auth.schoolId !== schoolId) return { ok: false, status: 403, message: 'Forbidden' };
    if (auth.studentId === studentId) return { ok: true };
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  return { ok: false, status: 403, message: 'Forbidden' };
}
