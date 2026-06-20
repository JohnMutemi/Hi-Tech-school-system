import { NextRequest, NextResponse } from 'next/server';
import { generateResetToken, getResetExpiryDate } from '@/lib/admin-auth';
import { sendGradingResetEmail } from '@/lib/services/admin-auth-email-service';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';
import { prisma } from '@/lib/prisma';

const GRADING_RESET_ROLES = ['teacher', 'school_admin'] as const;

function isDatabaseConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes("Can't reach database server");
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    const normalizedEmail = String(email).trim().toLowerCase();

    const gate = await resolveGradingGateForSchoolCode(params.schoolCode);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const gradingUser = await prisma.user.findFirst({
      where: {
        schoolId: gate.school.id,
        role: { in: [...GRADING_RESET_ROLES] },
        email: { equals: normalizedEmail, mode: 'insensitive' },
      },
    });

    if (!gradingUser) {
      const anySchoolUser = await prisma.user.findFirst({
        where: {
          schoolId: gate.school.id,
          email: { equals: normalizedEmail, mode: 'insensitive' },
        },
        select: { id: true, role: true, email: true },
      });
      return NextResponse.json({
        success: true,
        message: 'If this account exists, a password reset link has been sent.',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              debugHint: anySchoolUser
                ? `Account found with role "${anySchoolUser.role}" for ${anySchoolUser.email}. Grading reset only works for teacher or school_admin roles.`
                : 'No account found for this email in the selected school.',
            }
          : {}),
      });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = getResetExpiryDate();
    const baseUrl = request.nextUrl.origin.replace(/\/$/, '');
    const resetLink = `${baseUrl}/schools/${encodeURIComponent(
      gate.school.code
    )}/grading/reset-password?token=${encodeURIComponent(resetToken)}`;

    await prisma.user.update({
      where: { id: gradingUser.id },
      data: { resetToken, resetTokenExpiry },
    });

    const emailSent = await sendGradingResetEmail(gradingUser.email, gate.school.name, resetLink);
    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Password reset link sent to your email.'
        : 'Unable to send reset email now. Please try again.',
      ...(process.env.NODE_ENV !== 'production'
        ? { debugResetLink: resetLink, debugResetToken: resetToken }
        : {}),
    });
  } catch (error) {
    console.error('Grading forgot password error:', error);
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          error: 'Database is temporarily unreachable. Please check DATABASE_URL/network and try again.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to process forgot password.' }, { status: 500 });
  }
}
