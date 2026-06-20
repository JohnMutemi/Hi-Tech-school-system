'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GradingWorkflowSnapshot, GradingWorkflowStepId } from '@/modules/grading-module/domain/workflow';

export function useGradingWorkflow(schoolCode: string) {
  const [workflow, setWorkflow] = useState<GradingWorkflowSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/grading/${encodeURIComponent(schoolCode)}/workflow`, {
        credentials: 'include',
      });
      const payload = await res.json();
      if (res.ok) {
        setWorkflow(payload.data);
      }
    } finally {
      setLoading(false);
    }
  }, [schoolCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isUnlocked = useCallback(
    (stepId: GradingWorkflowStepId) =>
      workflow?.steps.find((step) => step.id === stepId)?.unlocked ?? stepId === 'structure',
    [workflow]
  );

  const isComplete = useCallback(
    (stepId: GradingWorkflowStepId) =>
      workflow?.steps.find((step) => step.id === stepId)?.complete ?? false,
    [workflow]
  );

  return {
    workflow,
    loading,
    refresh,
    isUnlocked,
    isComplete,
    nextStep: workflow?.nextStep ?? 'structure',
  };
}
