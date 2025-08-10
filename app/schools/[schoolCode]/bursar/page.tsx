'use client';

import { BursarDashboard } from '@/components/bursar/BursarDashboard';
import { useParams } from 'next/navigation';

export default function BursarPage() {
  const params = useParams();
  const schoolCode = params.schoolCode as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <BursarDashboard schoolCode={schoolCode} />
    </div>
  );
}

