'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpenCheck, GraduationCap, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolThemeTokens } from '@/lib/utils/school-theme';
import {
  staffPortalLinks,
  type StaffPortalLink,
  type StaffPortalLinkId,
} from '@/lib/staff-portal-path';

type ModulePortalPickerProps = {
  schoolCode: string;
  packageType: string;
  schoolName?: string;
  logoUrl?: string | null;
  colorTheme?: string | null;
};

const ICONS: Record<StaffPortalLinkId, typeof Wallet> = {
  admin: GraduationCap,
  finance: Wallet,
  academics: BookOpenCheck,
  modules: GraduationCap,
};

export function ModulePortalPicker({
  schoolCode,
  packageType,
  schoolName,
  logoUrl,
  colorTheme,
}: ModulePortalPickerProps) {
  const theme = getSchoolThemeTokens(colorTheme);
  const links = staffPortalLinks(schoolCode, packageType);

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{
        background: `linear-gradient(to bottom right, ${theme.primarySoft}, #f8fafc, ${theme.primaryLight})`,
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${schoolName ?? 'School'} logo`}
                className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-cover"
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white"
                style={{ color: theme.primary }}
              >
                <GraduationCap className="h-7 w-7" />
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hi-Tech School Management
              </p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                {schoolName ?? 'School Portal'}
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            School code:{' '}
            <span className="font-mono font-semibold text-slate-800">{schoolCode.toUpperCase()}</span>
          </p>
          <p className="mt-2 text-base text-slate-700">
            Your subscription includes separate workspaces. Choose the module you want to open.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {links.map((link) => (
            <ModuleCard key={link.id} link={link} themePrimary={theme.primary} themeDark={theme.primaryDark} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  link,
  themePrimary,
  themeDark,
}: {
  link: StaffPortalLink;
  themePrimary: string;
  themeDark: string;
}) {
  const Icon = ICONS[link.id] ?? GraduationCap;

  return (
    <Link href={link.path} className="group block h-full">
      <Card className="h-full border-slate-200/90 transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader className="space-y-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themeDark})` }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {link.shortLabel}
            </p>
            <CardTitle className="text-xl">{link.label}</CardTitle>
          </div>
          <CardDescription className="text-sm leading-relaxed">{link.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span
            className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: themePrimary }}
          >
            Open {link.shortLabel}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Fetches school branding then renders the picker. */
export function ModulePortalPickerLoader({ schoolCode, packageType }: { schoolCode: string; packageType: string }) {
  const [schoolName, setSchoolName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colorTheme, setColorTheme] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/schools/${schoolCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setSchoolName(data.name);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.colorTheme) setColorTheme(data.colorTheme);
      })
      .catch(() => undefined);
  }, [schoolCode]);

  return (
    <ModulePortalPicker
      schoolCode={schoolCode}
      packageType={packageType}
      schoolName={schoolName}
      logoUrl={logoUrl}
      colorTheme={colorTheme}
    />
  );
}
