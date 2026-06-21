'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { getSchoolThemeTokens, hexToRgba } from '@/lib/utils/school-theme';
import {
  ACADEMICS_PORTAL_LABEL,
  getPackageLabel,
  isStandaloneFinancePackage,
} from '@/lib/school-package';
import {
  staffPortalLinks,
  type StaffPortalLink,
  type StaffPortalLinkId,
} from '@/lib/staff-portal-path';

type StaffLoginHubProps = {
  schoolCode: string;
  packageType: string;
  schoolName?: string;
  logoUrl?: string | null;
  colorTheme?: string | null;
};

const MODULE_META: Record<
  StaffPortalLinkId,
  {
    icon: typeof Wallet;
    accent: string;
    accentSoft: string;
    gradient: string;
  }
> = {
  admin: {
    icon: LayoutDashboard,
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.12)',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  finance: {
    icon: Wallet,
    accent: '#059669',
    accentSoft: 'rgba(5, 150, 105, 0.12)',
    gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  },
  academics: {
    icon: BookOpenCheck,
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  },
  modules: {
    icon: GraduationCap,
    accent: '#64748b',
    accentSoft: 'rgba(100, 116, 139, 0.12)',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
};

const HERO_QUOTES = [
  {
    quote: 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.',
    author: 'Malcolm X',
  },
  {
    quote: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    quote: 'Develop a passion for learning. If you do, you will never cease to grow.',
    author: "Anthony J. D'Angelo",
  },
];

export function StaffLoginHub({
  schoolCode,
  packageType,
  schoolName,
  logoUrl,
  colorTheme,
}: StaffLoginHubProps) {
  const theme = getSchoolThemeTokens(colorTheme);
  const links = staffPortalLinks(schoolCode, packageType);
  const packageLabel = getPackageLabel(packageType);
  const showAcademicsUpgrade = isStandaloneFinancePackage(packageType);
  const cardCount = links.length + (showAcademicsUpgrade ? 1 : 0);
  const heroQuote = HERO_QUOTES[Math.abs(schoolCode.length) % HERO_QUOTES.length];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Branded hero panel — mirrors individual module login shells */}
        <aside
          className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between"
          style={{
            background: `linear-gradient(to bottom right, ${theme.primaryDeeper}, ${theme.primaryDark}, ${theme.primary})`,
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(circle at 20% 20%, ${hexToRgba('#ffffff', 0.15)} 0%, transparent 45%),
                  radial-gradient(circle at 80% 80%, ${hexToRgba(theme.primaryLight, 0.2)} 0%, transparent 50%)`,
              }}
            />
          </div>

          <div className="relative flex flex-1 flex-col justify-between p-10 text-white">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide">
                  Hi-Tech School Management
                </span>
              </div>

              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${schoolName ?? 'School'} logo`}
                    className="h-14 w-14 rounded-xl border border-white/25 bg-white/10 object-cover shadow-lg"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/25 bg-white/10 shadow-lg"
                    style={{ color: theme.primaryLight }}
                  >
                    <GraduationCap className="h-7 w-7" />
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold leading-tight">
                    {schoolName ?? 'Staff Portal'}
                  </h2>
                  <p className="mt-1 font-mono text-sm text-white/70">
                    {schoolCode.toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="max-w-md text-2xl font-semibold leading-snug">
                  Your secure gateway to every workspace your school subscribes to.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
                  Choose the module that matches your role today — finance, academics, or full
                  administration — each with its own dedicated login.
                </p>
              </div>
            </div>

            <div className="max-w-sm rounded-2xl border border-white/20 bg-black/20 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/90">&quot;{heroQuote.quote}&quot;</p>
              <p className="mt-3 text-xs font-medium text-white/70">— {heroQuote.author}</p>
            </div>
          </div>
        </aside>

        {/* Module picker */}
        <main
          className="flex w-full flex-col justify-center p-4 sm:p-8 lg:w-1/2"
          style={{
            background: `linear-gradient(to bottom right, ${theme.primarySoft}, #f8fafc, ${hexToRgba(theme.primary, 0.12)})`,
          }}
        >
          <div className="mx-auto w-full max-w-lg">
            {/* Mobile-only header */}
            <header className="mb-6 text-center lg:hidden">
              <div className="mb-4 flex flex-col items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${schoolName ?? 'School'} logo`}
                    className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-cover shadow-md"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-md"
                    style={{ color: theme.primary }}
                  >
                    <GraduationCap className="h-7 w-7" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {schoolName ?? 'Staff Portal'}
                  </h1>
                  <p className="font-mono text-xs text-slate-500">{schoolCode.toUpperCase()}</p>
                </div>
              </div>
            </header>

            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-6"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark}, ${theme.primary})`,
                }}
              />

              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Staff Login</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pick your workspace to continue to the secure sign-in page.
                </p>
                <div
                  className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: theme.primaryLight,
                    color: theme.primaryDark,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Subscription: {packageLabel}
                </div>
              </div>

              {showAcademicsUpgrade ? (
                <AcademicsUpgradeBanner theme={theme} />
              ) : null}

              <div
                className={`grid gap-3 ${
                  cardCount === 1
                    ? 'grid-cols-1'
                    : cardCount === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {links.map((link, index) => (
                  <StaffModuleCard
                    key={link.id}
                    link={link}
                    themePrimary={theme.primary}
                    index={index}
                  />
                ))}
                {showAcademicsUpgrade ? (
                  <LockedAcademicsCard theme={theme} index={links.length} />
                ) : null}
              </div>

              <p className="mt-5 text-center text-xs text-slate-500">
                Parents and students should use the links on your school&apos;s public website.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AcademicsUpgradeBanner({
  theme,
}: {
  theme: ReturnType<typeof getSchoolThemeTokens>;
}) {
  return (
    <div
      className="mb-4 rounded-xl border p-4"
      style={{
        borderColor: hexToRgba(theme.primary, 0.25),
        background: `linear-gradient(135deg, ${hexToRgba(theme.primary, 0.08)}, ${hexToRgba(theme.primaryLight, 0.5)})`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: hexToRgba(theme.primary, 0.15), color: theme.primaryDark }}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Ready to bring academics on board?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Unlock CBC mark entry, report cards, and class rankings alongside your finance
            workspace. Reach out to your Hi-Tech administrator to add the{' '}
            <span className="font-medium text-slate-800">Academics &amp; Grading</span> module —
            we&apos;ll handle the rest.
          </p>
        </div>
      </div>
    </div>
  );
}

function StaffModuleCard({
  link,
  themePrimary,
  index,
}: {
  link: StaffPortalLink;
  themePrimary: string;
  index: number;
}) {
  const meta = MODULE_META[link.id] ?? MODULE_META.modules;
  const Icon = meta.icon;
  const accent = link.id === 'admin' ? themePrimary : meta.accent;

  return (
    <Link href={link.path} className="group relative block">
      <article
        className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div
          className="absolute inset-x-0 top-0 h-0.5 opacity-80 transition-opacity group-hover:opacity-100"
          style={{ background: meta.gradient }}
        />

        <div className="mb-3 flex items-start justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{ background: meta.gradient }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: meta.accentSoft, color: accent }}
          >
            {link.shortLabel}
          </span>
        </div>

        <h3 className="mb-1 text-base font-semibold text-slate-900">{link.label}</h3>
        <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-500">{link.description}</p>

        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2"
          style={{ color: accent }}
        >
          Continue to login
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </article>
    </Link>
  );
}

function LockedAcademicsCard({
  theme,
  index,
}: {
  theme: ReturnType<typeof getSchoolThemeTokens>;
  index: number;
}) {
  const meta = MODULE_META.academics;
  const Icon = meta.icon;

  return (
    <article
      className="relative flex h-full cursor-not-allowed flex-col overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 opacity-90"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-disabled="true"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-300" />

      <div className="mb-3 flex items-start justify-between">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
          <Icon className="h-4 w-4 text-slate-500" />
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
            <Lock className="h-2.5 w-2.5 text-slate-500" />
          </div>
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Locked
        </span>
      </div>

      <h3 className="mb-1 text-base font-semibold text-slate-700">{ACADEMICS_PORTAL_LABEL}</h3>
      <p className="mb-3 flex-1 text-xs leading-relaxed text-slate-500">
        CBC mark entry, report cards, class rankings, and grading scales.
      </p>

      <p
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: theme.primaryDark }}
      >
        <Lock className="h-3 w-3" />
        Contact admin to unlock access
      </p>
    </article>
  );
}

/** Fetches school branding then renders the hub. */
export function StaffLoginHubLoader({
  schoolCode,
  packageType,
  initialSchoolName,
  initialLogoUrl,
  initialColorTheme,
}: {
  schoolCode: string;
  packageType: string;
  initialSchoolName?: string;
  initialLogoUrl?: string | null;
  initialColorTheme?: string | null;
}) {
  const [schoolName, setSchoolName] = useState(initialSchoolName ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [colorTheme, setColorTheme] = useState<string | null>(initialColorTheme ?? null);

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
    <StaffLoginHub
      schoolCode={schoolCode}
      packageType={packageType}
      schoolName={schoolName}
      logoUrl={logoUrl}
      colorTheme={colorTheme}
    />
  );
}

/** @deprecated Use StaffLoginHub — kept for backward compatibility. */
export const ModulePortalPicker = StaffLoginHub;
export const ModulePortalPickerLoader = StaffLoginHubLoader;
