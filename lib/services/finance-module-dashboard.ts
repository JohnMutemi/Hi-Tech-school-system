import { prisma } from '@/lib/prisma';
import {
  FEE_SEG_BOARDER,
  FEE_SEG_DAY_SCHOLAR,
} from '@/lib/fees/fee-structure-resolve';
import {
  deriveFeePaymentStatus,
  type FeePaymentStatus,
} from '@/lib/fees/fee-payment-status';
import {
  computeStudentFeesSnapshot,
  resolveAcademicYearIdForSchool,
  type StudentWithClass,
} from '@/lib/services/student-fees-snapshot';
import { mapWithConcurrency } from '@/lib/utils/map-with-concurrency';

/** Workers for a single paginated page */
const PAGE_SNAPSHOT_CONCURRENCY = 4;
/** Workers when computing school-wide summary (all students) */
const SUMMARY_SNAPSHOT_CONCURRENCY = 6;

export const DASHBOARD_DEFAULT_PAGE_SIZE = 25;
export const DASHBOARD_MAX_PAGE_SIZE = 100;

function toDateInputValue(d: Date | null | undefined): string | null {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().slice(0, 10);
}

export type FinanceDashboardOptions = {
  academicYear?: string | null;
  term?: string | null;
  gradeId?: string | null;
  classId?: string | null;
  feeAccommodation?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  /** Return only summary + byGrade (computes all students server-side) */
  summaryOnly?: boolean;
  /** Return every matching student (export); ignores page */
  fetchAll?: boolean;
  /** Paginate only students with balance > 0 (still computes all for filtering) */
  outstandingOnly?: boolean;
};

type FinanceStudentBalance = {
  id: string;
  name: string;
  admissionNumber: string;
  email: string | null;
  phone: string | null;
  gradeName: string;
  className: string;
  academicYear: number;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  parent: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  feeAccommodation: string;
  dateAdmitted: string | null;
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
  paymentStatus: FeePaymentStatus;
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

export type DashboardPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type FinanceDashboardPayload = {
  success: true;
  students: FinanceStudentBalance[];
  summary: {
    totalStudents: number;
    totalOutstanding: number;
    studentsWithBalance: number;
    fullyPaid: number;
    partiallyPaid: number;
    unpaidBillable: number;
    noBillableFee: number;
    totalFeeRequired: number;
    totalPaid: number;
  };
  byGrade: GradeRollup[];
  academicYear: string;
  term: string;
  pagination: DashboardPagination;
};

const studentListInclude = {
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
    orderBy: { paymentDate: 'desc' as const },
    take: 1,
    select: {
      id: true,
      amount: true,
      paymentDate: true,
      paymentMethod: true,
    },
  },
};

const studentListOrderBy = [
  { class: { grade: { name: 'asc' as const } } },
  { class: { name: 'asc' as const } },
  { user: { name: 'asc' as const } },
];

function buildWhereClause(
  schoolId: string,
  options: FinanceDashboardOptions
): Record<string, unknown> {
  const whereClause: Record<string, unknown> = {
    schoolId,
    isActive: true,
    status: { not: 'graduated' },
  };

  if (options.gradeId) {
    whereClause.class = { gradeId: options.gradeId };
  }

  if (options.classId) {
    whereClause.classId = options.classId;
  }

  const accRaw = options.feeAccommodation?.trim().toLowerCase() ?? '';
  if (accRaw && accRaw !== 'all') {
    if (accRaw === FEE_SEG_BOARDER || accRaw === 'boarder') {
      whereClause.feeAccommodation = FEE_SEG_BOARDER;
    } else if (accRaw === FEE_SEG_DAY_SCHOLAR || accRaw === 'day_scholar') {
      whereClause.feeAccommodation = FEE_SEG_DAY_SCHOLAR;
    }
  }

  const search = options.search?.trim();
  if (search) {
    whereClause.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { admissionNumber: { contains: search, mode: 'insensitive' } },
      { parentName: { contains: search, mode: 'insensitive' } },
      { parent: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return whereClause;
}

function buildSummary(studentsWithBalances: FinanceStudentBalance[]) {
  return {
    totalStudents: studentsWithBalances.length,
    totalOutstanding: studentsWithBalances.reduce((sum, s) => sum + s.balance, 0),
    studentsWithBalance: studentsWithBalances.filter((s) => s.balance > 0).length,
    fullyPaid: studentsWithBalances.filter((s) => s.paymentStatus === 'fully_paid').length,
    partiallyPaid: studentsWithBalances.filter((s) => s.paymentStatus === 'partial').length,
    unpaidBillable: studentsWithBalances.filter((s) => s.paymentStatus === 'outstanding').length,
    noBillableFee: studentsWithBalances.filter(
      (s) => s.paymentStatus === 'no_fee' || s.paymentStatus === 'payment_on_file'
    ).length,
    totalFeeRequired: studentsWithBalances.reduce((sum, s) => sum + s.totalFeeRequired, 0),
    totalPaid: studentsWithBalances.reduce((sum, s) => sum + s.totalPaid, 0),
  };
}

function buildByGrade(studentsWithBalances: FinanceStudentBalance[]): GradeRollup[] {
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
  return Array.from(byGradeMap.values()).sort((a, b) =>
    a.gradeName.localeCompare(b.gradeName)
  );
}

async function mapRowsToBalances(
  rows: Awaited<ReturnType<typeof prisma.student.findMany>>,
  school: { id: string; code: string },
  targetAcademicYearId: string | null,
  academicYear: string,
  termFilter: string | null,
  concurrency: number
): Promise<FinanceStudentBalance[]> {
  return mapWithConcurrency(rows, concurrency, async (row) => {
    const student = row as typeof row & {
      feeAccommodation?: string | null;
      dateAdmitted?: Date | null;
    };
    try {
      const snapshot = await computeStudentFeesSnapshot(
        prisma,
        school,
        student as unknown as StudentWithClass,
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
        parentName: student.parentName ?? null,
        parentPhone: student.parentPhone ?? null,
        parentEmail: student.parentEmail ?? null,
        parent: student.parent
          ? {
              id: student.parent.id,
              name: student.parent.name,
              email: student.parent.email,
              phone: student.parent.phone,
            }
          : null,
        feeAccommodation: student.feeAccommodation || 'day_scholar',
        dateAdmitted: toDateInputValue(student.dateAdmitted),
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
        paymentStatus: deriveFeePaymentStatus(
          snapshot.totalFeeRequired,
          snapshot.totalPaid,
          snapshot.outstanding
        ),
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
        parentName: student.parentName ?? null,
        parentPhone: student.parentPhone ?? null,
        parentEmail: student.parentEmail ?? null,
        parent: student.parent
          ? {
              id: student.parent.id,
              name: student.parent.name,
              email: student.parent.email,
              phone: student.parent.phone,
            }
          : null,
        feeAccommodation: student.feeAccommodation || 'day_scholar',
        dateAdmitted: toDateInputValue(student.dateAdmitted),
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
        paymentStatus: 'error' as FeePaymentStatus,
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
  });
}

function parseDashboardQueryOptions(
  searchParams: URLSearchParams | FinanceDashboardOptions
): FinanceDashboardOptions {
  if (searchParams instanceof URLSearchParams) {
    const pageRaw = searchParams.get('page');
    const pageSizeRaw = searchParams.get('pageSize');
    return {
      gradeId: searchParams.get('gradeId'),
      classId: searchParams.get('classId'),
      academicYear: searchParams.get('academicYear'),
      term: searchParams.get('term'),
      feeAccommodation: searchParams.get('feeAccommodation'),
      search: searchParams.get('search'),
      page: pageRaw ? parseInt(pageRaw, 10) : undefined,
      pageSize: pageSizeRaw ? parseInt(pageSizeRaw, 10) : undefined,
      summaryOnly: searchParams.get('summaryOnly') === '1',
      fetchAll: searchParams.get('fetchAll') === '1',
      outstandingOnly: searchParams.get('outstandingOnly') === '1',
    };
  }
  return searchParams;
}

/** Map URL search params to dashboard options (shared by API routes). */
export function dashboardOptionsFromSearchParams(
  searchParams: URLSearchParams
): FinanceDashboardOptions {
  return parseDashboardQueryOptions(searchParams);
}

export async function getFinanceDashboardData(
  schoolCode: string,
  optionsInput: FinanceDashboardOptions | URLSearchParams = {}
): Promise<FinanceDashboardPayload | null> {
  const options = parseDashboardQueryOptions(optionsInput);
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

  const whereClause = buildWhereClause(school.id, options);
  const emptySummary = {
    totalStudents: 0,
    totalOutstanding: 0,
    studentsWithBalance: 0,
    fullyPaid: 0,
    partiallyPaid: 0,
    unpaidBillable: 0,
    noBillableFee: 0,
    totalFeeRequired: 0,
    totalPaid: 0,
  };

  // —— School-wide summary (all matching students) ——
  if (options.summaryOnly) {
    const rows = await prisma.student.findMany({
      where: whereClause,
      include: studentListInclude,
      orderBy: studentListOrderBy,
    });
    const balances = await mapRowsToBalances(
      rows,
      school,
      targetAcademicYearId,
      academicYear,
      termFilter,
      SUMMARY_SNAPSHOT_CONCURRENCY
    );
    return {
      success: true,
      students: [],
      summary: buildSummary(balances),
      byGrade: buildByGrade(balances),
      academicYear,
      term: termFilter ?? 'all',
      pagination: {
        page: 1,
        pageSize: 0,
        total: rows.length,
        totalPages: 1,
      },
    };
  }

  // —— Outstanding-only list (compute all, return one page of debtors) ——
  if (options.outstandingOnly) {
    const rows = await prisma.student.findMany({
      where: whereClause,
      include: studentListInclude,
      orderBy: studentListOrderBy,
    });
    const allBalances = await mapRowsToBalances(
      rows,
      school,
      targetAcademicYearId,
      academicYear,
      termFilter,
      SUMMARY_SNAPSHOT_CONCURRENCY
    );
    const outstanding = allBalances.filter((s) => s.balance > 0);
    const total = outstanding.length;
    const pageSize = Math.min(
      DASHBOARD_MAX_PAGE_SIZE,
      Math.max(1, options.pageSize ?? DASHBOARD_DEFAULT_PAGE_SIZE)
    );
    const page = Math.max(1, options.page ?? 1);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const students = outstanding.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize
    );
    return {
      success: true,
      students,
      summary: emptySummary,
      byGrade: [],
      academicYear,
      term: termFilter ?? 'all',
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  // —— Full export / legacy (all students in one response) ——
  if (options.fetchAll) {
    const rows = await prisma.student.findMany({
      where: whereClause,
      include: studentListInclude,
      orderBy: studentListOrderBy,
    });
    const balances = await mapRowsToBalances(
      rows,
      school,
      targetAcademicYearId,
      academicYear,
      termFilter,
      SUMMARY_SNAPSHOT_CONCURRENCY
    );
    return {
      success: true,
      students: balances,
      summary: buildSummary(balances),
      byGrade: buildByGrade(balances),
      academicYear,
      term: termFilter ?? 'all',
      pagination: {
        page: 1,
        pageSize: balances.length,
        total: balances.length,
        totalPages: 1,
      },
    };
  }

  // —— Paginated student page (fast path) ——
  const total = await prisma.student.count({ where: whereClause });
  const pageSize = Math.min(
    DASHBOARD_MAX_PAGE_SIZE,
    Math.max(1, options.pageSize ?? DASHBOARD_DEFAULT_PAGE_SIZE)
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  const skip = (page - 1) * pageSize;

  const rows =
    total === 0
      ? []
      : await prisma.student.findMany({
          where: whereClause,
          include: studentListInclude,
          orderBy: studentListOrderBy,
          skip,
          take: pageSize,
        });

  const students = await mapRowsToBalances(
    rows,
    school,
    targetAcademicYearId,
    academicYear,
    termFilter,
    PAGE_SNAPSHOT_CONCURRENCY
  );

  return {
    success: true,
    students,
    summary: emptySummary,
    byGrade: [],
    academicYear,
    term: termFilter ?? 'all',
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
