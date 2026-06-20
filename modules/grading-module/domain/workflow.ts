export const GRADING_WORKFLOW_STEPS = [
  'structure',
  'scales',
  'scores',
  'rankings',
  'reports',
  'performance',
] as const;

export type GradingWorkflowStepId = (typeof GRADING_WORKFLOW_STEPS)[number];

export type GradingTab = GradingWorkflowStepId;

export type GradingWorkflowStepStatus = {
  id: GradingWorkflowStepId;
  order: number;
  label: string;
  description: string;
  complete: boolean;
  unlocked: boolean;
};

export type GradingWorkflowSnapshot = {
  steps: GradingWorkflowStepStatus[];
  nextStep: GradingWorkflowStepId;
  structureReady: boolean;
  scalesReady: boolean;
  scoresReady: boolean;
  rankingsReady: boolean;
  reportsReady: boolean;
};

export const WORKFLOW_STEP_META: Record<
  GradingWorkflowStepId,
  { order: number; label: string; description: string }
> = {
  structure: {
    order: 1,
    label: 'Academic Setup',
    description: 'Years, terms, subjects, classes, student roster, and assessment types',
  },
  scales: {
    order: 2,
    label: 'Grading Scales',
    description: 'Clone presets and assign bands to your school',
  },
  scores: {
    order: 3,
    label: 'Score Entry',
    description: 'Enter or import marks per assessment (roster required)',
  },
  rankings: {
    order: 4,
    label: 'Class Rankings',
    description: 'Compute positions and export spreadsheets',
  },
  reports: {
    order: 5,
    label: 'Report Cards',
    description: 'Generate and download learner report cards',
  },
  performance: {
    order: 6,
    label: 'Performance Review',
    description: 'Roster, per-subject marks, and live class ranking',
  },
};
