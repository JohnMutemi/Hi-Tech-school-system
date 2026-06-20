import { prisma } from '@/lib/prisma';
import {
  GRADING_WORKFLOW_STEPS,
  type GradingWorkflowSnapshot,
  type GradingWorkflowStepId,
  WORKFLOW_STEP_META,
} from '../domain/workflow';
import { getGradingStructure } from './structureService';

export async function getGradingWorkflowSnapshot(schoolId: string): Promise<GradingWorkflowSnapshot> {
  const structure = await getGradingStructure(schoolId);

  const structureReady =
    structure.academicYears.length > 0 &&
    structure.terms.length > 0 &&
    structure.subjects.length > 0 &&
    structure.assessmentTypes.length > 0 &&
    structure.classes.some((cls) => Boolean(cls.legacyClassId) && Boolean(cls.gradingScaleId));

  const schoolScales = structure.scales.filter((scale) => scale.schoolId === schoolId);
  const scalesReady = structureReady && schoolScales.length > 0;

  const [assessmentCount, savedScoreCount, overallResultCount] = await Promise.all([
    prisma.gradingModAssessment.count({ where: { schoolId } }),
    prisma.gradingModScore.count({
      where: { assessment: { schoolId }, rawScore: { not: null } },
    }),
    prisma.gradingModOverallResult.count({
      where: { class: { schoolId } },
    }),
  ]);

  const scoresReady = scalesReady && assessmentCount > 0;
  const rankingsReady = scoresReady && savedScoreCount > 0;
  const reportsReady = rankingsReady && overallResultCount > 0;

  const completion: Record<GradingWorkflowStepId, boolean> = {
    structure: structureReady,
    scales: scalesReady,
    scores: scoresReady && savedScoreCount > 0,
    rankings: reportsReady || overallResultCount > 0,
    reports: reportsReady,
    performance: reportsReady,
  };

  const unlock: Record<GradingWorkflowStepId, boolean> = {
    structure: true,
    scales: structureReady,
    scores: scalesReady,
    rankings: rankingsReady,
    reports: rankingsReady,
    performance: reportsReady,
  };

  const steps = GRADING_WORKFLOW_STEPS.map((id) => ({
    id,
    order: WORKFLOW_STEP_META[id].order,
    label: WORKFLOW_STEP_META[id].label,
    description: WORKFLOW_STEP_META[id].description,
    complete: completion[id],
    unlocked: unlock[id],
  }));

  const nextStep =
    steps.find((step) => !step.complete)?.id ?? ('performance' as GradingWorkflowStepId);

  return {
    steps,
    nextStep,
    structureReady,
    scalesReady,
    scoresReady,
    rankingsReady,
    reportsReady,
  };
}
