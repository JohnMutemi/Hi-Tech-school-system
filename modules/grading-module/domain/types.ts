import type { GradingModBand, GradingModScale } from '@prisma/client';

export type GradingBandInput = Pick<
  GradingModBand,
  'code' | 'label' | 'description' | 'minScore' | 'maxScore' | 'points' | 'colorHex' | 'sortOrder'
>;

export type GradingScaleWithBands = GradingModScale & {
  bands: GradingModBand[];
};

export type SubjectResultPayload = {
  studentId: string;
  subjectId: string;
  termId: string;
  weightedScore: number;
  bandId: string;
  points: number | null;
};

export type OverallResultPayload = {
  studentId: string;
  termId: string;
  classId: string;
  meanPoints: number;
  meanBandId: string | null;
  totalPoints: number;
  subjectsSat: number;
  classPosition: number;
  classSize: number;
};
