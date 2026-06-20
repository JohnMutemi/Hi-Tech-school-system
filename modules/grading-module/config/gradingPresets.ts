export type GradingPresetBand = {
  code: string;
  label: string;
  description?: string;
  min: number;
  max: number;
  points: number;
  color: string;
};

export type GradingPreset = {
  presetKey: string;
  name: string;
  curriculum: 'CBC' | '8-4-4' | 'IGCSE' | 'CUSTOM';
  level: string;
  bands: GradingPresetBand[];
};

export const GRADING_PRESETS: GradingPreset[] = [
  {
    presetKey: 'CBC_UPPER_PRIMARY',
    name: 'CBC Upper Primary',
    curriculum: 'CBC',
    level: 'upper_primary',
    bands: [
      { code: 'EE', label: 'Exceeding Expectations', min: 80, max: 100, points: 4, color: '#16a34a' },
      { code: 'ME', label: 'Meeting Expectations', min: 50, max: 79, points: 3, color: '#2563eb' },
      { code: 'AE', label: 'Approaching Expectations', min: 40, max: 49, points: 2, color: '#d97706' },
      { code: 'BE', label: 'Below Expectations', min: 0, max: 39, points: 1, color: '#dc2626' },
    ],
  },
  {
    presetKey: 'CBC_JUNIOR_SECONDARY',
    name: 'CBC Junior Secondary (KNEC 8-point)',
    curriculum: 'CBC',
    level: 'junior_secondary',
    bands: [
      { code: 'EE1', label: 'Exceeding Expectations 1', min: 90, max: 100, points: 8, color: '#15803d' },
      { code: 'EE2', label: 'Exceeding Expectations 2', min: 75, max: 89, points: 7, color: '#16a34a' },
      { code: 'ME1', label: 'Meeting Expectations 1', min: 65, max: 74, points: 6, color: '#1d4ed8' },
      { code: 'ME2', label: 'Meeting Expectations 2', min: 55, max: 64, points: 5, color: '#2563eb' },
      { code: 'AE1', label: 'Approaching Expectations 1', min: 45, max: 54, points: 4, color: '#b45309' },
      { code: 'AE2', label: 'Approaching Expectations 2', min: 35, max: 44, points: 3, color: '#d97706' },
      { code: 'BE1', label: 'Below Expectations 1', min: 25, max: 34, points: 2, color: '#b91c1c' },
      { code: 'BE2', label: 'Below Expectations 2', min: 0, max: 24, points: 1, color: '#dc2626' },
    ],
  },
  {
    presetKey: 'LEGACY_844',
    name: '8-4-4 Letter Grade',
    curriculum: '8-4-4',
    level: 'secondary',
    bands: [
      { code: 'A', label: 'A', min: 75, max: 100, points: 12, color: '#15803d' },
      { code: 'A-', label: 'A-', min: 70, max: 74, points: 11, color: '#16a34a' },
      { code: 'B+', label: 'B+', min: 65, max: 69, points: 10, color: '#22c55e' },
      { code: 'B', label: 'B', min: 60, max: 64, points: 9, color: '#1d4ed8' },
      { code: 'B-', label: 'B-', min: 55, max: 59, points: 8, color: '#2563eb' },
      { code: 'C+', label: 'C+', min: 50, max: 54, points: 7, color: '#3b82f6' },
      { code: 'C', label: 'C', min: 45, max: 49, points: 6, color: '#d97706' },
      { code: 'C-', label: 'C-', min: 40, max: 44, points: 5, color: '#f59e0b' },
      { code: 'D+', label: 'D+', min: 35, max: 39, points: 4, color: '#ea580c' },
      { code: 'D', label: 'D', min: 30, max: 34, points: 3, color: '#dc2626' },
      { code: 'D-', label: 'D-', min: 25, max: 29, points: 2, color: '#b91c1c' },
      { code: 'E', label: 'E', min: 0, max: 24, points: 1, color: '#991b1b' },
    ],
  },
];

export function getPresetByKey(presetKey: string): GradingPreset | undefined {
  return GRADING_PRESETS.find((p) => p.presetKey === presetKey);
}
