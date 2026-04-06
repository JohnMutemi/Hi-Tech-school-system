import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  computeStudentFeesSnapshot,
  resolveAcademicYearIdForSchool,
} from '@/lib/services/student-fees-snapshot';
import { assertStudentFeeAccess, resolvePortalFeeAuth } from '@/lib/portal-fee-auth';

// GET: Fetch fee balances and payment history for a student
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearIdParam = searchParams.get('academicYearId');
    const academicYearNameParam = searchParams.get('academicYear');
    const termParam = searchParams.get('term');
    const termFilter =
      termParam && termParam.trim().toLowerCase() !== 'all'
        ? termParam.trim()
        : null;

    const school = await prisma.school.findFirst({
      where: { code: { equals: params.schoolCode, mode: 'insensitive' } },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const student = await prisma.student.findFirst({
      where: { id: params.studentId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        user: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const auth = await resolvePortalFeeAuth(request, params.schoolCode);
    const gate = await assertStudentFeeAccess(auth, school.id, params.studentId);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }

    const targetAcademicYearId = await resolveAcademicYearIdForSchool(
      prisma,
      school.id,
      academicYearIdParam,
      academicYearNameParam
    );

    const snapshot = await computeStudentFeesSnapshot(
      prisma,
      school,
      student,
      targetAcademicYearId,
      { persistYearEndCarryForward: true, termFilter }
    );

    if ('error' in snapshot) {
      return NextResponse.json(snapshot.body ?? { error: snapshot.error }, {
        status: snapshot.status,
      });
    }

    return NextResponse.json({
      student: snapshot.student,
      termBalances: snapshot.termBalances,
      academicYearOutstanding: snapshot.academicYearOutstanding,
      outstanding: snapshot.outstanding,
      arrears: snapshot.arrears,
      carryForwardArrears: snapshot.carryForwardArrears,
      carryForwardBreakdown: snapshot.carryForwardBreakdown,
      paymentHistory: snapshot.paymentHistory,
    });
  } catch (error: unknown) {
    console.error('Error fetching student fees:', error);
    return NextResponse.json({ error: 'Failed to fetch student fees' }, { status: 500 });
  }
}
