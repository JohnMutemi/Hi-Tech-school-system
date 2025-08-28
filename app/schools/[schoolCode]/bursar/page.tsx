'use client';

import { BursarDashboard } from '@/components/bursar/BursarDashboard';
import { useParams } from 'next/navigation';

export default function BursarPage() {
  const params = useParams();
  const schoolCode = params.schoolCode as string;

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

