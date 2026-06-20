import { prisma } from '@/lib/prisma';
import { isDualModulePackage, normalizePackageType } from '@/lib/school-package';
import { academicsPortalLoginPath, financePortalLoginPath } from '@/lib/staff-portal-path';
import { redirect } from 'next/navigation';
import { ModulePortalPickerLoader } from '@/components/school-portal/module-portal-picker';

interface ModulesPageProps {
  params: { schoolCode?: string };
}

export default async function SchoolModulesPage({ params }: ModulesPageProps) {
  const schoolCode = params.schoolCode;
  if (!schoolCode || schoolCode === 'undefined') {
    redirect('/');
  }

  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: 'insensitive' } },
    select: { packageType: true, isActive: true },
  });

  if (!school?.isActive) {
    redirect('/');
  }

  const packageType = normalizePackageType(school.packageType);

  if (!isDualModulePackage(packageType)) {
    if (packageType === 'finance_only') {
      redirect(financePortalLoginPath(schoolCode));
    }
    if (packageType === 'grading_only') {
      redirect(academicsPortalLoginPath(schoolCode));
    }
    redirect(`/schools/${schoolCode}`);
  }

  return <ModulePortalPickerLoader schoolCode={schoolCode} packageType={packageType} />;
}
