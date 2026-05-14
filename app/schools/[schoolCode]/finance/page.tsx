'use client';

import { useEffect, useState } from 'react';
import { BursarDashboard } from '@/components/bursar/BursarDashboard';
import { FinanceFirstLoginPasswordDialog } from '@/components/finance/FinanceFirstLoginPasswordDialog';
import { useParams, useRouter } from 'next/navigation';

export default function FinanceModulePage() {
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
        const response = await fetch(`/api/schools/${schoolCode}/finance/session`, {
          credentials: 'include',
        });

        if (!response.ok) {
          router.replace(`/schools/${schoolCode}/finance/login`);
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          setRequiresInitialPasswordChange(Boolean(data.requiresInitialPasswordChange));
          setAuthorized(true);
        }
      } catch {
        router.replace(`/schools/${schoolCode}/finance/login`);
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    };

    if (schoolCode) {
      validateSession();
    }

    return () => {
      cancelled = true;
    };
  }, [schoolCode, router]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-gray-700 font-medium">Validating finance access...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 relative">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #1e40af 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`,
            backgroundSize: '400px 400px',
          }}
        ></div>
      </div>
      <BursarDashboard schoolCode={schoolCode} mode="finance" />
      {requiresInitialPasswordChange ? (
        <FinanceFirstLoginPasswordDialog schoolCode={schoolCode} />
      ) : null}
    </div>
  );
}
