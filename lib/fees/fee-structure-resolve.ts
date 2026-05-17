export const FEE_SEG_DAY_SCHOLAR = 'day_scholar';
export const FEE_SEG_BOARDER = 'boarder';

const TERM_ORDER: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };

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
