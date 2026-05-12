'use client';

import { BursarDashboard } from '@/components/bursar/BursarDashboard';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function BursarPage() {
  const params = useParams();
  const router = useRouter();
  const schoolCode = params.schoolCode as string;
  const [checkingRoute, setCheckingRoute] = useState(true);

  useEffect(() => {
    let ignore = false;
    const enforceCanonicalDashboard = async () => {
      try {
        const response = await fetch(`/api/schools/${schoolCode}`);
        if (!response.ok || ignore) return;
        const data = await response.json();
        const packageType = String(data?.packageType || '').toLowerCase();
        if (packageType === 'finance_only') {
          router.replace(`/schools/${schoolCode}/finance`);
          return;
        }
      } catch (error) {
        console.error('Failed to resolve dashboard route:', error);
      } finally {
        if (!ignore) setCheckingRoute(false);
      }
    };

    if (schoolCode) {
      enforceCanonicalDashboard();
    }

    return () => {
      ignore = true;
    };
  }, [schoolCode, router]);

  if (checkingRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-gray-700 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 relative">
      {/* Professional Financial Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #1e40af 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`,
          backgroundSize: '400px 400px'
        }}></div>
      </div>
      <BursarDashboard schoolCode={schoolCode} />
    </div>
  );
}

