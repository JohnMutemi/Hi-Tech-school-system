'use client';

import { BursarDashboard } from '@/components/bursar/BursarDashboard';
import { useParams } from 'next/navigation';

export default function BursarPage() {
  const params = useParams();
  const schoolCode = params.schoolCode as string;

  return (
    <div className="container mx-auto py-6">
      <BursarDashboard schoolCode={schoolCode} />
    </div>
  );
}

