import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  computeStudentFeesSnapshot,
  resolveAcademicYearIdForSchool,
} from '@/lib/services/student-fees-snapshot';

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    const classId = searchParams.get('classId');
    const academicYear = searchParams.get('academicYear') || new Date().getFullYear().toString();
    const termParam = searchParams.get('term');
    const termFilter =
      termParam && termParam.trim().toLowerCase() !== 'all'
        ? termParam.trim()
        : null;

    const school = await prisma.school.findFirst({
      where: { code: { equals: schoolCode, mode: 'insensitive' } },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const targetAcademicYearId = await resolveAcademicYearIdForSchool(
      prisma,
      school.id,
      null,
      academicYear
    );

    let whereClause: Record<string, unknown> = {
      schoolId: school.id,
    };

    if (gradeId) {
      whereClause.class = {
        gradeId: gradeId,
      };
    }

    if (classId) {
      whereClause.classId = classId;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        class: {
          include: {
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 1,
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: [
        { class: { grade: { name: 'asc' } } },
        { class: { name: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });

    const studentsWithBalances = await Promise.all(
      students.map(async (student) => {
        try {
          const snapshot = await computeStudentFeesSnapshot(
            prisma,
            school,
            student,
            targetAcademicYearId,
            { persistYearEndCarryForward: false, termFilter }
          );

          if ('error' in snapshot) {
            throw new Error(snapshot.error);
          }

          return {
            id: student.id,
            name: student.user.name,
            admissionNumber: student.admissionNumber,
            email: student.user.email,
            phone: student.user.phone,
            gradeName: student.class?.grade?.name || 'N/A',
            className: student.class?.name || 'N/A',
            academicYear: parseInt(academicYear, 10) || new Date().getFullYear(),
            parent: student.parent
              ? {
                  id: student.parent.id,
                  name: student.parent.name,
                  email: student.parent.email,
                  phone: student.parent.phone,
                }
              : null,
            class: student.class
              ? {
                  id: student.class.id,
                  name: student.class.name,
                  grade: {
                    id: student.class.grade.id,
                    name: student.class.grade.name,
                  },
                }
              : null,
            feeStructure:
              snapshot.termBalances.length > 0
                ? {
                    id: termFilter ? `term-${termFilter}-${academicYear}` : `year-${academicYear}`,
                    name: termFilter
                      ? `${termFilter} — ${academicYear}`
                      : `Academic year ${academicYear}`,
                    totalAmount: snapshot.totalFeeRequired,
                    breakdown: {},
                  }
                : null,
            totalFeeRequired: snapshot.totalFeeRequired,
            totalPaid: snapshot.totalPaid,
            balance: snapshot.outstanding,
            lastPayment:
              student.payments.length > 0
                ? {
                    id: student.payments[0].id,
                    amount: student.payments[0].amount,
                    paymentDate: student.payments[0].paymentDate.toISOString(),
                    paymentMethod: student.payments[0].paymentMethod || '',
                  }
                : null,
          };
        } catch (error) {
          console.error(`Error calculating balance for student ${student.id}:`, error);
          return {
            id: student.id,
            name: student.user.name,
            admissionNumber: student.admissionNumber,
            email: student.user.email,
            phone: student.user.phone,
            gradeName: student.class?.grade?.name || 'N/A',
            className: student.class?.name || 'N/A',
            academicYear: parseInt(academicYear, 10) || new Date().getFullYear(),
            parent: student.parent
              ? {
                  id: student.parent.id,
                  name: student.parent.name,
                  email: student.parent.email,
                  phone: student.parent.phone,
                }
              : null,
            class: student.class
              ? {
                  id: student.class.id,
                  name: student.class.name,
                  grade: {
                    id: student.class.grade.id,
                    name: student.class.grade.name,
                  },
                }
              : null,
            feeStructure: null,
            totalFeeRequired: 0,
            totalPaid: 0,
            balance: 0,
            lastPayment:
              student.payments.length > 0
                ? {
                    id: student.payments[0].id,
                    amount: student.payments[0].amount,
                    paymentDate: student.payments[0].paymentDate.toISOString(),
                    paymentMethod: student.payments[0].paymentMethod || '',
                  }
                : null,
          };
        }
      })
    );

    const summary = {
      totalStudents: studentsWithBalances.length,
      totalOutstanding: studentsWithBalances.reduce((sum, s) => sum + s.balance, 0),
      studentsWithBalance: studentsWithBalances.filter((s) => s.balance > 0).length,
      fullyPaid: studentsWithBalances.filter((s) => s.balance <= 0).length,
    };

    return NextResponse.json({
      success: true,
      students: studentsWithBalances,
      summary,
      academicYear,
      term: termFilter ?? 'all',
    });
  } catch (error) {
    console.error('Error fetching students with fee balances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
