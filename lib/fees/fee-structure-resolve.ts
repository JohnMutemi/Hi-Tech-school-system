export const FEE_SEG_DAY_SCHOLAR = 'day_scholar';
export const FEE_SEG_BOARDER = 'boarder';

const TERM_ORDER: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };

export function normalizeTermName(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function termOrderIndex(termName: unknown): number {
  const key = String(termName ?? '').trim();
  return TERM_ORDER[key] || 0;
}

export type TermNameLookup =
  | Map<string, string>
  | Record<string, string | undefined | null>
  | Array<{ termId?: string | null; term?: string | null; name?: string | null }>
  | null
  | undefined;

function resolveTermNameFromLookup(
  termId: string | null | undefined,
  lookup: TermNameLookup
): string | null {
  if (!termId || !lookup) return null;
  if (lookup instanceof Map) {
    return lookup.get(termId) ?? null;
  }
  if (Array.isArray(lookup)) {
    const row = lookup.find((t) => t.termId === termId);
    return row?.term || row?.name || null;
  }
  return lookup[termId] ?? null;
}

/**
 * Resolve a display/order term name from explicit value or id lookup.
 * Never rely on UUID lexicographic order for term sequencing.
 */
export function resolveTermName(
  explicitName: unknown,
  termId?: string | null,
  lookup?: TermNameLookup
): string | null {
  const direct = String(explicitName ?? '').trim();
  if (direct) return direct;
  const fromLookup = resolveTermNameFromLookup(termId, lookup);
  return fromLookup ? String(fromLookup).trim() || null : null;
}

/**
 * Keep payments on/after the student's join term within the join academic year.
 *
 * IMPORTANT: Do not compare Term UUIDs with `<`. Waita 2026 Term 3's id sorts
 * before Term 1, which silently dropped fee-clean Term 3 payments.
 */
export function paymentIsOnOrAfterJoinTerm(
  payment: {
    academicYearId?: string | null;
    termId?: string | null;
    termName?: string | null;
    term?: { name?: string | null } | null;
  },
  join: {
    academicYearId: string;
    termId: string;
    termName?: string | null;
  },
  termNameLookup?: TermNameLookup
): boolean {
  if (!payment.academicYearId || !payment.termId) return false;
  if (payment.academicYearId < join.academicYearId) return false;
  if (payment.academicYearId !== join.academicYearId) return true;

  if (payment.termId === join.termId) return true;

  const joinName = resolveTermName(join.termName, join.termId, termNameLookup);
  const payName = resolveTermName(
    payment.termName ?? payment.term?.name,
    payment.termId,
    termNameLookup
  );
  const joinOrd = termOrderIndex(joinName);
  const payOrd = termOrderIndex(payName);

  if (joinOrd > 0 && payOrd > 0) {
    return payOrd >= joinOrd;
  }

  // Names unavailable: keep the payment (fail open). Dropping via UUID `<`
  // caused Term 3 balances to freeze while Term 1/2 still updated.
  return true;
}

/**
 * Fee structures and Term rows can drift (especially Term 3 after year setup).
 * Payments are tagged with Term.id; snapshot rows use TermlyFeeStructure.termId.
 * Match by id first, then by normalized term name so fee-clean Term N payers still allocate.
 */
export function paymentAppliesToFeeStructure(
  payment: { termId?: string | null; termName?: string | null },
  feeStructure: { termId?: string | null; term?: string | null },
  academicYearId?: string | null,
  paymentAcademicYearId?: string | null
): boolean {
  if (
    academicYearId != null &&
    paymentAcademicYearId != null &&
    academicYearId !== paymentAcademicYearId
  ) {
    return false;
  }
  if (payment.termId && feeStructure.termId && payment.termId === feeStructure.termId) {
    return true;
  }
  const payName = normalizeTermName(payment.termName);
  const fsName = normalizeTermName(feeStructure.term);
  return Boolean(payName && fsName && payName === fsName);
}

export function findTermBalanceRow<T extends { termId?: string | null; term?: string | null }>(
  rows: T[] | undefined | null,
  needle: { termId?: string | null; termName?: string | null }
): T | undefined {
  if (!rows?.length) return undefined;
  if (needle.termId) {
    const byId = rows.find((t) => t.termId === needle.termId);
    if (byId) return byId;
  }
  const name = normalizeTermName(needle.termName);
  if (!name) return undefined;
  return rows.find((t) => normalizeTermName(t.term) === name);
}

export function normalizeStudentFeeSegment(raw: unknown): string {
  if (raw === FEE_SEG_BOARDER || raw === 'boarder') return FEE_SEG_BOARDER;
  return FEE_SEG_DAY_SCHOLAR;
}

/** Unified (legacy) rows omit `feeAccommodation` or leave it null. */
export function matchesFeeSegment(
  structureFee: string | null | undefined,
  studentSegment: string
): boolean {
  if (structureFee == null || String(structureFee).trim() === '') return true;
  return structureFee === studentSegment;
}

/**
 * For each distinct `term`, pick the best matching structure for this student:
 * prefer an explicit segment match over a unified (`null`) row.
 */
export function resolveTermStructuresForFees<
  T extends { term: string; feeAccommodation?: string | null },
>(structures: T[], studentSegmentRaw: unknown): T[] {
  const studentSegment = normalizeStudentFeeSegment(studentSegmentRaw);

  const byTerm = new Map<string, T[]>();
  for (const fs of structures) {
    if (!matchesFeeSegment(fs.feeAccommodation, studentSegment)) continue;
    const list = byTerm.get(fs.term) || [];
    list.push(fs);
    byTerm.set(fs.term, list);
  }

  const picked: T[] = [];
  for (const [, list] of byTerm) {
    if (!list.length) continue;
    const ranked = [...list].sort((a, b) => {
      const w = (x: T) => (x.feeAccommodation ? 1 : 0);
      return w(b) - w(a);
    });
    picked.push(ranked[0]);
  }

  return picked.sort((a, b) => (TERM_ORDER[a.term] || 0) - (TERM_ORDER[b.term] || 0));
}
