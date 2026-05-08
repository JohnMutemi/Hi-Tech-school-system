import { prisma } from '@/lib/prisma';
import {
  computeStudentFeesSnapshot,
  resolveAcademicYearIdForSchool,
} from '@/lib/services/student-fees-snapshot';

type FinanceDashboardOptions = {
  academicYear?: string | null;
  term?: string | null;
  gradeId?: string | null;
  classId?: string | null;
};

type FinanceStudentBalance = {
  id: string;
  name: string;
  admissionNumber: string;
  email: string;
  phone: string;
  gradeName: string;
  className: string;
  academicYear: number;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  class: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
    };
  } | null;
  feeStructure: {
    id: string;
    name: string;
    totalAmount: number;
    breakdown: Record<string, unknown>;
  } | null;
  totalFeeRequired: number;
  totalPaid: number;
  balance: number;
  lastPayment: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  } | null;
};

type GradeRollup = {
  gradeName: string;
  totalStudents: number;
  totalFeeRequired: number;
  totalPaid: number;
  totalOutstanding: number;
};

export type FinanceDashboardPayload = {
  success: true;
  students: FinanceStudentBalance[];
  summary: {
    totalStudents: number;
    totalOutstanding: number;
    studentsWithBalance: number;
    fullyPaid: number;
    totalFeeRequired: number;
    totalPaid: number;
  };
  byGrade: GradeRollup[];
  academicYear: string;
  term: string;
};

export async function getFinanceDashboardData(
  schoolCode: string,
  options: FinanceDashboardOptions = {}
): Promise<FinanceDashboardPayload | null> {
  const academicYear =
    options.academicYear?.trim() || new Date().getFullYear().toString();
  const termParam = options.term?.trim();
  const termFilter =
    termParam && termParam.toLowerCase() !== 'all' ? termParam : null;

  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: 'insensitive' } },
  });

  if (!school) {
    return null;
  }

  const targetAcademicYearId = await resolveAcademicYearIdForSchool(
    prisma,
    school.id,
    null,
    academicYear
  );

  const whereClause: Record<string, unknown> = {
    schoolId: school.id,
  };

  if (options.gradeId) {
    whereClause.class = {
      gradeId: options.gradeId,
    };
  }

  if (options.classId) {
    whereClause.classId = options.classId;
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

  const studentsWithBalances: FinanceStudentBalance[] = await Promise.all(
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
                    ? `${termFilter} - ${academicYear}`
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
    totalFeeRequired: studentsWithBalances.reduce((sum, s) => sum + s.totalFeeRequired, 0),
    totalPaid: studentsWithBalances.reduce((sum, s) => sum + s.totalPaid, 0),
  };

  const byGradeMap = new Map<string, GradeRollup>();
  for (const student of studentsWithBalances) {
    const key = student.gradeName || 'N/A';
    const existing = byGradeMap.get(key) || {
      gradeName: key,
      totalStudents: 0,
      totalFeeRequired: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    };
    existing.totalStudents += 1;
    existing.totalFeeRequired += student.totalFeeRequired;
    existing.totalPaid += student.totalPaid;
    existing.totalOutstanding += student.balance;
    byGradeMap.set(key, existing);
  }

  return {
    success: true,
    students: studentsWithBalances,
    summary,
    byGrade: Array.from(byGradeMap.values()).sort((a, b) =>
      a.gradeName.localeCompare(b.gradeName)
    ),
    academicYear,
    term: termFilter ?? 'all',
  };
}
