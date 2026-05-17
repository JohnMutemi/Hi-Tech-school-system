import type { PrismaClient, School, Student, User, Class, Grade } from '@prisma/client';
import { academicYearTransitionService } from '@/lib/services/academic-year-transition-service';
import { resolveTermStructuresForFees } from '@/lib/fees/fee-structure-resolve';

export type StudentWithClass = Student & {
  user: User;
  class: (Class & { grade: Grade }) | null;
} & {
  /** Present on DB model; widen for Prisma client stale / partial picks. */
  feeAccommodation?: string | null;
};

export type TermBalanceRow = {
  termId: string | null;
  academicYearId: string | null;
  term: string;
  year: number;
  totalAmount: unknown;
  balance: number;
  baseBalance: number;
  carryForward: number;
  carryToNext: number;
  paidAmount: number;
  academicYearOutstanding: number;
};

export type StudentFeesSnapshot = {
  student: {
    id: string;
    name: string | null;
    admissionNumber: string;
    gradeName: string;
    className: string;
  };
  termBalances: TermBalanceRow[];
  academicYearOutstanding: number;
  outstanding: number;
  arrears: number;
  carryForwardArrears: number;
  carryForwardBreakdown: unknown[];
  paymentHistory: Array<{
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string | undefined;
    description: string | null;
    receiptNumber: string | null;
    referenceNumber: string | null;
  }>;
  /** Sum of term fee amounts for the resolved academic year */
  totalFeeRequired: number;
  /** Sum of payment amounts recorded for that academic year (after join filters) */
  totalPaid: number;
};

type ComputeOptions = {
  persistYearEndCarryForward?: boolean;
  /**
   * When set (e.g. "Term 1"), totals and balances reflect that term only
   * (carry-forward from earlier terms in the year is already baked into the row).
   * Omit or use "all" for full academic-year view including arrears.
   */
  termFilter?: string | null;
};

/**
 * Single source of truth for term balances, carry-forward, and yearly outstanding
 * (same rules as the parent-facing GET /students/[id]/fees endpoint).
 */
export async function computeStudentFeesSnapshot(
  prisma: PrismaClient,
  school: School,
  student: StudentWithClass,
  targetAcademicYearId: string | null,
  options: ComputeOptions = {}
): Promise<StudentFeesSnapshot | { error: string; status: number; body?: unknown }> {
  const targetGradeId = student.class?.gradeId;
  const persistYearEndCarryForward = options.persistYearEndCarryForward ?? false;
  const rawTermFilter = options.termFilter?.trim();
  const termFilterActive =
    rawTermFilter && rawTermFilter.toLowerCase() !== 'all' ? rawTermFilter : null;

  if (!targetGradeId) {
    return {
      error: 'Student is not assigned to a grade',
      status: 400,
      body: {
        student: {
          id: student.id,
          name: student.user?.name,
          admissionNumber: student.admissionNumber,
          gradeName: 'Not Assigned',
          className: student.class?.name || 'Not Assigned',
        },
      },
    };
  }

  let feeStructures = resolveTermStructuresForFees(
    await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: targetGradeId,
        isActive: true,
        ...(targetAcademicYearId ? { academicYearId: targetAcademicYearId } : {}),
        NOT: [{ termId: null }, { academicYearId: null }],
      },
      include: {
        grade: true,
        academicYear: { select: { name: true } },
      },
    }),
    student.feeAccommodation
  );

  const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
  const filteredFeeStructures = [...feeStructures].sort(
    (a, b) => (termOrder[a.term] || 0) - (termOrder[b.term] || 0)
  );

  const payments = await prisma.payment.findMany({
    where: {
      studentId: student.id,
      ...(targetAcademicYearId ? { academicYearId: targetAcademicYearId } : {}),
    },
    orderBy: { paymentDate: 'asc' },
    select: {
      id: true,
      studentId: true,
      amount: true,
      createdAt: true,
      paymentDate: true,
      referenceNumber: true,
      receiptNumber: true,
      description: true,
      receivedBy: true,
      academicYearId: true,
      termId: true,
      academicYear: { select: { name: true } },
      term: { select: { name: true } },
      receipt: true,
    },
  });

  const joinAcademicYearId = student.joinedAcademicYearId;
  const joinTermId = student.joinedTermId;
  const joinDate = student.dateAdmitted ? new Date(student.dateAdmitted) : null;

  let filteredPayments = payments;
  if (joinAcademicYearId && joinTermId) {
    filteredPayments = filteredPayments.filter((p) => {
      if (!p.academicYearId || !p.termId) return false;
      if (p.academicYearId < joinAcademicYearId) return false;
      if (p.academicYearId === joinAcademicYearId && p.termId < joinTermId) return false;
      return true;
    });
  } else if (joinDate) {
    filteredPayments = filteredPayments.filter(
      (p) => p.paymentDate && new Date(p.paymentDate) >= joinDate
    );
  }

  let transactions: Array<{
    ref: string;
    description: string;
    debit: number;
    credit: number;
    date: Date;
    type: string;
    termId: string | null;
    academicYearId: string | null;
    termName: string;
    academicYearName: string;
    balance?: number;
  }> = [];

  for (const fs of filteredFeeStructures) {
    transactions.push({
      ref: fs.id,
      description: `INVOICE - ${fs.term || ''} ${fs.year || ''}`,
      debit: Number(fs.totalAmount),
      credit: 0,
      date: fs.createdAt,
      type: 'invoice',
      termId: fs.termId,
      academicYearId: fs.academicYearId,
      termName: fs.term || '',
      academicYearName: fs.year ? fs.year.toString() : '',
    });
  }

  for (const p of filteredPayments) {
    transactions.push({
      ref: p.receiptNumber || p.referenceNumber || p.id,
      description: p.description || 'PAYMENT',
      debit: 0,
      credit: Number(p.amount),
      date: p.paymentDate,
      type: 'payment',
      termId: p.termId,
      academicYearId: p.academicYearId,
      termName: p.term?.name || '',
      academicYearName: p.academicYear?.name || '',
    });
  }

  transactions = transactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningBalance = 0;
  transactions = transactions.map((txn) => {
    runningBalance += (txn.debit || 0) - (txn.credit || 0);
    return { ...txn, balance: runningBalance };
  });

  const academicYearOutstanding =
    transactions.length > 0 ? transactions[transactions.length - 1].balance! : 0;

  let carryForward = 0;
  if (filteredFeeStructures.length > 0) {
    const firstTerm = filteredFeeStructures[0];
    const academicYearNumber = parseInt(String(firstTerm.year), 10);
    if (!Number.isNaN(academicYearNumber)) {
      try {
        const previousYearBalance = await prisma.studentYearlyBalance.findUnique({
          where: {
            studentId_academicYear: {
              studentId: student.id,
              academicYear: academicYearNumber - 1,
            },
          },
        });
        if (previousYearBalance && previousYearBalance.closingBalance > 0) {
          carryForward = previousYearBalance.closingBalance;
        }
      } catch {
        /* no previous balance */
      }
    }
  }

  const termBalances: TermBalanceRow[] = [];
  let academicYearCarryForward: {
    studentId: string;
    nextAcademicYear: number;
    carryForwardAmount: number;
  } | null = null;

  for (let index = 0; index < filteredFeeStructures.length; index++) {
    const fs = filteredFeeStructures[index];
    const charges = transactions
      .filter(
        (txn) =>
          txn.termId === fs.termId &&
          txn.academicYearId === fs.academicYearId &&
          txn.type === 'invoice'
      )
      .reduce((sum, txn) => sum + (txn.debit || 0), 0);

    const paymentsForTerm = transactions
      .filter(
        (txn) =>
          txn.termId === fs.termId &&
          txn.academicYearId === fs.academicYearId &&
          txn.type === 'payment'
      )
      .reduce((sum, txn) => sum + (txn.credit || 0), 0);

    let baseBalance = charges - paymentsForTerm;
    let balance = baseBalance + carryForward;
    let carryToNext = 0;

    if (balance < 0) {
      carryToNext = balance;
      balance = 0;
    }

    let effectivePaidAmount = paymentsForTerm;
    if (carryForward < 0) {
      effectivePaidAmount = paymentsForTerm + Math.abs(carryForward);
    }

    const isLastTerm = index === filteredFeeStructures.length - 1;

    termBalances.push({
      termId: fs.termId,
      academicYearId: fs.academicYearId,
      term: fs.term,
      year: fs.year,
      totalAmount: fs.totalAmount,
      balance: Math.max(0, balance),
      baseBalance,
      carryForward,
      carryToNext,
      paidAmount: effectivePaidAmount,
      academicYearOutstanding,
    });

    if (!isLastTerm) {
      carryForward = carryToNext;
    } else if (carryToNext !== 0) {
      const academicYearNumber = parseInt(String(fs.year), 10);
      if (!Number.isNaN(academicYearNumber)) {
        academicYearCarryForward = {
          studentId: student.id,
          nextAcademicYear: academicYearNumber + 1,
          carryForwardAmount: carryToNext,
        };
      }
    }
  }

  if (persistYearEndCarryForward && academicYearCarryForward) {
    try {
      await academicYearTransitionService.handleYearEndCarryForward(
        academicYearCarryForward.studentId,
        academicYearCarryForward.nextAcademicYear,
        academicYearCarryForward.carryForwardAmount
      );
    } catch (error) {
      console.error('Error handling year-end carry forward:', error);
    }
  }

  const arrearsRecords = await prisma.studentArrear.findMany({
    where: {
      studentId: student.id,
      schoolId: school.id,
      ...(joinAcademicYearId ? { academicYearId: { gte: joinAcademicYearId } } : {}),
    },
  });

  const arrears = arrearsRecords.reduce((sum, record) => sum + record.arrearAmount, 0);
  const outstanding = academicYearOutstanding + arrears;

  const totalFeeRequired = filteredFeeStructures.reduce(
    (sum, fs) => sum + Number(fs.totalAmount),
    0
  );
  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const mapPaymentHistory = (
    list: typeof payments
  ): StudentFeesSnapshot['paymentHistory'] =>
    list.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.receipt?.paymentMethod,
      description: payment.description,
      receiptNumber: payment.receiptNumber,
      referenceNumber: payment.referenceNumber,
    }));

  const fullYearSnapshot: StudentFeesSnapshot = {
    student: {
      id: student.id,
      name: student.user?.name ?? null,
      admissionNumber: student.admissionNumber,
      gradeName: student.class?.grade?.name || 'Not Assigned',
      className: student.class?.name || 'Not Assigned',
    },
    termBalances,
    academicYearOutstanding,
    outstanding,
    arrears,
    carryForwardArrears: 0,
    carryForwardBreakdown: [],
    paymentHistory: mapPaymentHistory(payments),
    totalFeeRequired,
    totalPaid,
  };

  if (!termFilterActive) {
    return fullYearSnapshot;
  }

  const norm = (s: string) => s.trim().toLowerCase();
  const row = fullYearSnapshot.termBalances.find(
    (t) => norm(t.term) === norm(termFilterActive)
  );

  if (!row) {
    return {
      ...fullYearSnapshot,
      termBalances: [],
      academicYearOutstanding: 0,
      outstanding: 0,
      arrears: 0,
      totalFeeRequired: 0,
      totalPaid: 0,
      paymentHistory: [],
    };
  }

  const paymentsForTerm = payments.filter((p) => p.termId === row.termId);

  return {
    ...fullYearSnapshot,
    termBalances: [row],
    academicYearOutstanding: row.balance,
    outstanding: row.balance,
    arrears: 0,
    totalFeeRequired: Number(row.totalAmount),
    totalPaid: row.paidAmount,
    paymentHistory: mapPaymentHistory(paymentsForTerm),
  };
}

export async function resolveAcademicYearIdForSchool(
  prisma: PrismaClient,
  schoolId: string,
  academicYearIdParam: string | null,
  academicYearNameParam: string | null
): Promise<string | null> {
  if (academicYearIdParam) return academicYearIdParam;
  if (academicYearNameParam) {
    const ayByName = await prisma.academicYear.findFirst({
      where: { schoolId, name: academicYearNameParam },
    });
    return ayByName?.id ?? null;
  }
  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  return currentYear?.id ?? null;
}
