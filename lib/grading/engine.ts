export type GradeBand = {
  min: number;
  max: number;
  letter: string;
  points?: number;
  remark?: string;
};

export type GradingCriteriaPayload = {
  passMark: number;
  scaleBands: GradeBand[];
};

export type AutoGradeInput = {
  totalWeightedScore: number;
  totalWeight: number;
  criteria: GradingCriteriaPayload;
};

export type AutoGradeOutput = {
  percentage: number;
  letterGrade: string;
  gradePoint: number | null;
  passStatus: boolean;
  remarks: string;
};

export function normalizeBands(scaleBands: GradeBand[]): GradeBand[] {
  return [...scaleBands].sort((a, b) => b.min - a.min);
}

export function resolveGradeBand(percentage: number, scaleBands: GradeBand[]): GradeBand | null {
  const normalized = normalizeBands(scaleBands);
  return normalized.find((band) => percentage >= band.min && percentage <= band.max) ?? null;
}

export function computeAutoGrade(input: AutoGradeInput): AutoGradeOutput {
  const percentage =
    input.totalWeight > 0
      ? Number(((input.totalWeightedScore / input.totalWeight) * 100).toFixed(2))
      : 0;

  const matchedBand = resolveGradeBand(percentage, input.criteria.scaleBands);
  const letterGrade = matchedBand?.letter ?? "N/A";
  const gradePoint = typeof matchedBand?.points === "number" ? matchedBand.points : null;
  const passStatus = percentage >= input.criteria.passMark;
  const remarks =
    matchedBand?.remark ??
    (passStatus ? "Meets grading criteria" : "Below required pass mark");

  return {
    percentage,
    letterGrade,
    gradePoint,
    passStatus,
    remarks,
  };
}
