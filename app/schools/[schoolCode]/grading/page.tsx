'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GradingDashboard } from '@/components/grading/GradingDashboard';
import { GradingFirstLoginPasswordDialog } from '@/components/grading/GradingFirstLoginPasswordDialog';

export default function GradingModulePage() {
  const params = useParams();
  const router = useRouter();
  const schoolCode = params.schoolCode as string;
  const [authorized, setAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [requiresInitialPasswordChange, setRequiresInitialPasswordChange] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolCode}/grading/session`, {
          credentials: 'include',
        });

        if (!response.ok) {
          router.replace(`/schools/${schoolCode}/grading/login`);
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          setRequiresInitialPasswordChange(Boolean(data.requiresInitialPasswordChange));
          setAuthorized(true);
        }
      } catch {
        router.replace(`/schools/${schoolCode}/grading/login`);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    if (schoolCode) validateSession();
    return () => { cancelled = true; };
  }, [schoolCode, router]);

  const sessionReady = !checkingSession && authorized;

  return (
    <div className="min-h-screen">
      <GradingDashboard
        schoolCode={schoolCode}
        mode="grading"
        skipSessionFetch
        sessionReady={sessionReady}
      />
      {sessionReady && requiresInitialPasswordChange ? (
        <GradingFirstLoginPasswordDialog schoolCode={schoolCode} />
      ) : null}
    </div>
  );
}
