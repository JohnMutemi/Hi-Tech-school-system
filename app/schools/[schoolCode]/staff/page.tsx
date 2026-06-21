import { prisma } from '@/lib/prisma';
import { normalizePackageType } from '@/lib/school-package';
import { resolvePrimaryColor } from '@/lib/school-website/palettes';
import { redirect } from 'next/navigation';
import { StaffLoginHubLoader } from '@/components/school-portal/staff-login-hub';

interface StaffPageProps {
  params: { schoolCode?: string };
}

export default async function SchoolStaffLoginPage({ params }: StaffPageProps) {
  const schoolCode = params.schoolCode;
  if (!schoolCode || schoolCode === 'undefined') {
    redirect('/');
  }

  const school = await prisma.school.findFirst({
    where: { code: { equals: schoolCode, mode: 'insensitive' } },
    select: {
      packageType: true,
      isActive: true,
      name: true,
      logo: true,
      colorTheme: true,
      colorPaletteSlug: true,
    },
  });

  if (!school?.isActive) {
    redirect('/');
  }

  const packageType = normalizePackageType(school.packageType);

  return (
    <StaffLoginHubLoader
      schoolCode={schoolCode}
      packageType={packageType}
      initialSchoolName={school.name}
      initialLogoUrl={school.logo}
      initialColorTheme={resolvePrimaryColor(school.colorTheme, school.colorPaletteSlug)}
    />
  );
}
