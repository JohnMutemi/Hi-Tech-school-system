export const DEFAULT_GRADE_NAMES = Array.from({ length: 9 }, (_, index) => `Grade ${index + 1}`);

function parseGradeNumber(name: string): number {
  const match = String(name).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

export function sortGradeNames(names: string[]): string[] {
  return [...names].sort((a, b) => parseGradeNumber(a) - parseGradeNumber(b) || a.localeCompare(b));
}

