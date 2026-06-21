import { redirect } from 'next/navigation';
import { staffLoginHubPath } from '@/lib/staff-portal-path';

interface ModulesPageProps {
  params: { schoolCode?: string };
}

/** Legacy route — redirects to the canonical staff login hub. */
export default function SchoolModulesPage({ params }: ModulesPageProps) {
  const schoolCode = params.schoolCode;
  if (!schoolCode || schoolCode === 'undefined') {
    redirect('/');
  }
  redirect(staffLoginHubPath(schoolCode));
}
