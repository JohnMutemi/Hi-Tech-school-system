'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Rocket,
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
  }
> = {
  admin: {
    icon: LayoutDashboard,
    accent: '#6366f1',
    accentSoft: 'rgba(99,102,241,0.12)',
  },
  finance: {
    icon: Wallet,
    accent: '#059669',
    accentSoft: 'rgba(5,150,105,0.12)',
  },
  academics: {
    icon: BookOpenCheck,
    accent: '#2563eb',
    accentSoft: 'rgba(37,99,235,0.12)',
  },
  modules: {
    icon: GraduationCap,
    accent: '#64748b',
    accentSoft: 'rgba(100,116,139,0.12)',
  },
};

// Fixed app-level palette for everything OUTSIDE the card (page wash, frame
// mat, background icons). Deliberately not derived from the school's own
// colour — schools can pick any brand colour for their hero panel, and this
// neutral-but-deliberate slate/indigo backdrop is chosen to sit well behind
// all of them rather than risk clashing with any one of them.
const OUTER_WASH = '#f8fafc'; // slate-50
const OUTER_FRAME = 'rgba(99, 102, 241, 0.07)'; // indigo-500 @ 7%, soft mat around the card

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

// ─────────────────────────────────────────────
// Outer background image
// ─────────────────────────────────────────────
// Single, centered, non-repeating background graphic behind the card.
// Points at a hosted image asset (Cloudinary).
const STAFF_BG_IMAGE_URL =
  'https://res.cloudinary.com/dvmhicvnw/image/upload/v1782031711/staff_logo_nwayuy.png';
const STAFF_BG_PATTERN_URL = `url('${STAFF_BG_IMAGE_URL}')`;

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
  const heroQuote = HERO_QUOTES[Math.abs(schoolCode.length) % HERO_QUOTES.length];

  // Derive a deep hero background from the school's primary colour.
  // We darken it heavily so the hero always reads as a rich dark panel,
  // while still carrying the school's hue. The hero stays school-specific —
  // only the area *outside* the card switches to the fixed palette below.
  const heroBg = hexToRgba(theme.primaryDeeper, 1);
  const heroGeoA = hexToRgba(theme.primary, 0.18);
  const heroGeoB = hexToRgba(theme.primaryDark, 0.18);

  return (
    // Full-screen layout — fixed Slate & Indigo backdrop, independent of school colour.
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{ backgroundColor: OUTER_WASH }}
    >
      {/* ── Background image layer: inset from the viewport edges with its own
          rounded corners, so the image reads as a framed graphic rather than
          a full-bleed page background. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-6 z-0 rounded-[40px] sm:inset-10"
        style={{
          backgroundImage: STAFF_BG_PATTERN_URL,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
        }}
      />

      {/* ── Framed wrapper: fixed indigo mat around the card, not across the page ── */}
      <div
        className="relative z-10 w-full max-w-[640px] rounded-[32px] p-4 sm:p-5"
        style={{ backgroundColor: OUTER_FRAME }}
      >
        <div className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">

          {/* ── Hero header ── */}
          <HeroHeader
            schoolName={schoolName}
            schoolCode={schoolCode}
            packageLabel={packageLabel}
            logoUrl={logoUrl}
            heroBg={heroBg}
            geoA={heroGeoA}
            geoB={heroGeoB}
            themePrimary={theme.primary}
          />

          {/* ── Body ── */}
          <div className="px-6 pt-5 pb-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-700">
                {links.length > 1 ? 'Choose your workspace' : 'Staff login'}
              </p>
            </div>

            {showAcademicsUpgrade && (
              <AcademicsUpgradeBanner theme={theme} />
            )}

            {links.map((link) => (
              <StaffModuleCard
                key={link.id}
                link={link}
                themePrimary={theme.primary}
                themePrimaryLight={theme.primaryLight}
              />
            ))}

            {showAcademicsUpgrade && <LockedAcademicsCard />}
          </div>

          {/* ── Footer ── */}
          <footer className="border-t border-black/[0.05] bg-slate-50 px-6 py-3">
            <p className="text-center text-[11px] leading-snug text-slate-500">
              Parents and students should use the links on your school&apos;s public website.
            </p>
            <p className="mt-1 text-center text-[11px] italic leading-snug text-slate-500">
              &ldquo;{heroQuote.quote}&rdquo; &mdash; {heroQuote.author}
            </p>
          </footer>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero header
// ─────────────────────────────────────────────

function HeroHeader({
  schoolName,
  schoolCode,
  packageLabel,
  logoUrl,
  heroBg,
  geoA,
  geoB,
  themePrimary,
}: {
  schoolName?: string;
  schoolCode: string;
  packageLabel: string;
  logoUrl?: string | null;
  heroBg: string;
  geoA: string;
  geoB: string;
  themePrimary: string;
}) {
  return (
    <div
      className="relative flex flex-col items-center px-8 pb-6 pt-7 text-center"
      style={{ backgroundColor: heroBg }}
    >
      {/* Subtle geometric circles — school accent colours, very low opacity */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="90%" cy="15%" r="120" fill={geoA} />
        <circle cx="8%"  cy="85%" r="90"  fill={geoA} />
        <circle cx="50%" cy="110%" r="80" fill={geoB} />
      </svg>

      {/* Logo */}
      <div className="relative z-10 mb-3">
        <div className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[18px] border border-white/[0.18] bg-white/[0.07]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${schoolName ?? 'School'} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <GraduationCap className="h-7 w-7" style={{ color: themePrimary }} />
          )}
        </div>
        {/* Pulse dot */}
        <span
          className="absolute -right-1.5 -top-1.5 flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 text-white"
          style={{ backgroundColor: themePrimary, borderColor: heroBg }}
        >
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      </div>

      {/* School identity */}
      <h1 className="z-10 text-[19px] font-medium leading-snug text-white">
        {schoolName ?? 'Staff Portal'}
      </h1>
      <p className="z-10 mt-1 font-mono text-[10px] tracking-[0.06em] text-white/75">
        {schoolCode.toUpperCase()}
      </p>

      {/* Package chip */}
      <div className="z-10 mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/10 px-3.5 py-1 text-[11px] font-medium text-white/90">
        <Sparkles className="h-3 w-3" />
        Subscription: {packageLabel}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Upgrade banner
// ─────────────────────────────────────────────

function AcademicsUpgradeBanner({
  theme,
}: {
  theme: ReturnType<typeof getSchoolThemeTokens>;
}) {
  return (
    <div
      className="mb-2.5 flex items-start gap-2.5 rounded-2xl border p-3"
      style={{
        backgroundColor: hexToRgba(theme.primary, 0.06),
        borderColor: hexToRgba(theme.primary, 0.18),
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: hexToRgba(theme.primary, 0.12) }}
      >
        <Rocket className="h-4 w-4" style={{ color: theme.primary }} />
      </div>
      <div>
        <p className="text-[13px] font-medium" style={{ color: theme.primaryDark }}>
          Ready to bring academics on board?
        </p>
        <p className="mt-0.5 text-[12px] leading-snug" style={{ color: theme.primaryDark }}>
          Unlock CBC mark entry, report cards, and class rankings. Reach out to your Hi-Tech
          administrator to add the{' '}
          <span className="font-medium">Academics &amp; Grading</span> module.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Active workspace card
// ─────────────────────────────────────────────

function StaffModuleCard({
  link,
  themePrimary,
  themePrimaryLight,
}: {
  link: StaffPortalLink;
  themePrimary: string;
  themePrimaryLight: string;
}) {
  const meta = MODULE_META[link.id] ?? MODULE_META.modules;
  const Icon = meta.icon;
  // Admin card adopts the school's primary colour; other modules keep their own accent.
  const accent      = link.id === 'admin' ? themePrimary : meta.accent;
  const accentSoft  = link.id === 'admin' ? hexToRgba(themePrimary, 0.12) : meta.accentSoft;
  const arrowBg     = link.id === 'admin' ? hexToRgba(themePrimary, 0.1) : hexToRgba(accent, 0.1);

  return (
    <Link href={link.path} className="group mb-2.5 block last:mb-0">
      <article
        className="relative flex items-center gap-3 overflow-hidden rounded-[16px] border border-black/[0.06] px-4 py-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-black/[0.1] hover:shadow-md"
        style={{ backgroundColor: hexToRgba(accent, 0.045) }}
      >
        {/* Icon tile */}
        <div
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] shadow-sm transition-transform duration-150 group-hover:scale-105"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-[19px] w-[19px] text-white" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-gray-900">{link.label}</h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide"
              style={{ backgroundColor: accentSoft, color: accent }}
            >
              {link.shortLabel}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12px] leading-snug text-slate-600">
            {link.description}
          </p>
        </div>

        {/* Arrow button */}
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-all duration-150 group-hover:translate-x-0.5 group-hover:scale-105"
          style={{ backgroundColor: arrowBg }}
        >
          <ArrowRight className="h-[14px] w-[14px]" style={{ color: accent }} />
        </div>
      </article>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Locked academics card
// ─────────────────────────────────────────────

function LockedAcademicsCard() {
  return (
    <article
      className="relative mb-0 flex cursor-not-allowed items-center gap-3 rounded-[16px] border border-dashed border-black/[0.1] bg-white px-4 py-3.5 opacity-70"
      aria-disabled="true"
    >
      {/* Icon tile with lock badge */}
      <div className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-slate-200">
        <BookOpenCheck className="h-[19px] w-[19px] text-slate-500" />
        <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-white">
          <Lock className="h-2.5 w-2.5 text-slate-500" />
        </span>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-medium text-slate-700">{ACADEMICS_PORTAL_LABEL}</h3>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-700">
            UPCOMING
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] leading-snug text-slate-500">
          CBC mark entry, report cards, class rankings.
        </p>
      </div>

      {/* Lock icon */}
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Lock className="h-[14px] w-[14px] text-slate-500" />
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// Loader (fetches school branding, then renders)
// ─────────────────────────────────────────────

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
  const [schoolName, setSchoolName]   = useState(initialSchoolName ?? '');
  const [logoUrl, setLogoUrl]         = useState<string | null>(initialLogoUrl ?? null);
  const [colorTheme, setColorTheme]   = useState<string | null>(initialColorTheme ?? null);

  useEffect(() => {
    fetch(`/api/schools/${schoolCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.name)       setSchoolName(data.name);
        if (data.logoUrl)    setLogoUrl(data.logoUrl);
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
export const ModulePortalPicker       = StaffLoginHub;
export const ModulePortalPickerLoader = StaffLoginHubLoader;