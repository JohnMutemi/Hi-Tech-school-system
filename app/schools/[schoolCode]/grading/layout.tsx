import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveGradingGateForSchoolCode } from '@/lib/grading-package-gate';

export const dynamic = 'force-dynamic';

export default async function GradingModuleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { schoolCode: string };
}) {
  const gate = await resolveGradingGateForSchoolCode(params.schoolCode);

  if (!gate.ok) {
    if (gate.status === 404) {
      notFound();
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Grading access unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{gate.error}</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
