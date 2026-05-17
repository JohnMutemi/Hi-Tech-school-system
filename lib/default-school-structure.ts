/** Ordered ladder for Kenyan private ECD + primary pathways. */
export const COMPREHENSIVE_GRADE_SEQUENCE = [
  "Playgroup & Day Care",
  "PP1",
  "PP2",
  ...Array.from({ length: 9 }, (_, index) => `Grade ${index + 1}`),
] as const;

export const DEFAULT_GRADE_NAMES = [...COMPREHENSIVE_GRADE_SEQUENCE];

function parseGradeNumber(name: string): number {
  const match = String(name).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

const ORDER_MAP = new Map<string, number>(
  COMPREHENSIVE_GRADE_SEQUENCE.map((n, i) => [n, i])
);

export function gradeSortKey(name: string): number {
  const n = ORDER_MAP.get(String(name).trim());
  if (n !== undefined) return n;
  return COMPREHENSIVE_GRADE_SEQUENCE.length + parseGradeNumber(name);
}

export function sortGradeNames(names: string[]): string[] {
  return [...names].sort(
    (a, b) => gradeSortKey(a) - gradeSortKey(b) || a.localeCompare(b)
  );
}
