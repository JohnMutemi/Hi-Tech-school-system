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
// Capped at 3/4 of the viewport's width AND height on every breakpoint, so
// it can read as "oversized" relative to the card without ever exceeding
// 75% page coverage — including on mobile.
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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden sm:px-6 sm:py-10"
      style={{ backgroundColor: OUTER_WASH }}
    >
      {/* ── Background image layer: sized to nearly fill the viewport (not a
          hard 3/4 box) and always using `cover`, so the artwork reads as a
          full backdrop instead of a small, mostly-empty inset. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[92vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: STAFF_BG_PATTERN_URL,
        }}
      />

      {/* ── Layout wrapper: positions and constrains the card's max-width only — no fill, no border, no rounding of its own, so the background photo is the only thing visible behind the card. ── */}
      <div className="relative z-10 w-full max-w-[640px]">
        <div className="flex min-h-screen flex-col overflow-hidden bg-white sm:min-h-0 sm:rounded-[24px] sm:border sm:border-black/[0.07] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">

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
          <div className="flex-1 px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
            <div className="mb-2 flex items-center gap-2 sm:mb-3">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-700 sm:text-[12px]">
                {links.length > 1 ? 'Choose your workspace' : 'Staff login'}
              </p>
            </div>

            {showAcademicsUpgrade && (
              <AcademicsUpgradeBanner theme={theme} />
            )}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
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
          </div>

          {/* ── Footer ── */}
          <footer className="border-t border-black/[0.05] bg-slate-50 px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:py-3">
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
      className="relative flex flex-col items-center px-5 pb-5 pt-[max(1.5rem,env(safe-area-inset-top))] text-center sm:px-8 sm:pb-6 sm:pt-7"
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
        <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[16px] border border-white/[0.18] bg-white/[0.07] sm:h-[60px] sm:w-[60px] sm:rounded-[18px]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${schoolName ?? 'School'} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: themePrimary }} />
          )}
        </div>
        {/* Pulse dot */}
        <span
          className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 text-white sm:h-[20px] sm:w-[20px]"
          style={{ backgroundColor: themePrimary, borderColor: heroBg }}
        >
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      </div>

      {/* School identity */}
      <h1 className="z-10 text-[17px] font-medium leading-snug text-white sm:text-[19px]">
        {schoolName ?? 'Staff Portal'}
      </h1>
      <p className="z-10 mt-1 font-mono text-[10px] tracking-[0.06em] text-white/75">
        {schoolCode.toUpperCase()}
      </p>

      {/* Package chip */}
      <div className="z-10 mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/10 px-3 py-1 text-[10px] font-medium text-white/90 sm:mt-3 sm:px-3.5 sm:text-[11px]">
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
      className="mb-2 flex items-start gap-2.5 rounded-2xl border p-2.5 sm:mb-2.5 sm:p-3"
      style={{
        backgroundColor: hexToRgba(theme.primary, 0.06),
        borderColor: hexToRgba(theme.primary, 0.18),
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] sm:h-8 sm:w-8"
        style={{ backgroundColor: hexToRgba(theme.primary, 0.12) }}
      >
        <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: theme.primary }} />
      </div>
      <div>
        <p className="text-[12px] font-medium sm:text-[13px]" style={{ color: theme.primaryDark }}>
          Ready to bring academics on board?
        </p>
        <p className="mt-0.5 text-[11px] leading-snug sm:text-[12px]" style={{ color: theme.primaryDark }}>
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

  return (
    <Link href={link.path} className="group block h-full">
      <article
        className="relative flex h-full flex-col overflow-hidden rounded-[16px] border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.18)] sm:rounded-[18px]"
        style={{
          backgroundColor: hexToRgba(accent, 0.045),
          borderColor: hexToRgba(accent, 0.14),
        }}
      >
        {/* Top accent line — a quiet gradient edge instead of a flat border */}
        <div
          className="h-[3px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.25)})`,
          }}
        />

        {/* Main content */}
        <div className="flex flex-1 items-center gap-2.5 px-3 pb-2.5 pt-3 sm:gap-3 sm:px-4 sm:pb-3 sm:pt-3.5">
          {/* Icon tile */}
          <div
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] shadow-sm transition-transform duration-150 group-hover:scale-105 sm:h-[44px] sm:w-[44px] sm:rounded-[14px]"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-[17px] w-[17px] text-white sm:h-[19px] sm:w-[19px]" />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-[14px] font-semibold text-gray-900 sm:text-[15px]">{link.label}</h3>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide"
                style={{ backgroundColor: accentSoft, color: accent }}
              >
                {link.shortLabel}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-600 sm:text-[12px]">
              {link.description}
            </p>
          </div>
        </div>

        {/* Quiet sign-in CTA strip — low-key by default, only steps forward on hover/tap */}
        <div
          className="flex items-center justify-end gap-1 border-t px-3 py-2 transition-colors duration-150 sm:px-4 sm:py-2.5"
          style={{ borderColor: hexToRgba(accent, 0.1) }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.05em] opacity-60 transition-opacity duration-150 group-hover:opacity-100 sm:text-[11px]"
            style={{ color: accent }}
          >
            Proceed to sign in
          </span>
          <ArrowRight
            className="h-3 w-3 opacity-60 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100 sm:h-3.5 sm:w-3.5"
            style={{ color: accent }}
          />
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
      className="relative flex h-full cursor-not-allowed flex-col overflow-hidden rounded-[16px] border border-dashed border-black/[0.1] bg-white opacity-70 sm:rounded-[18px]"
      aria-disabled="true"
    >
      {/* Top accent line — neutral, matching the dashed/disabled state */}
      <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-slate-300 to-slate-200" />

      {/* Main content */}
      <div className="flex flex-1 items-center gap-2.5 px-3 pb-2.5 pt-3 sm:gap-3 sm:px-4 sm:pb-3 sm:pt-3.5">
        {/* Icon tile with lock badge */}
        <div className="relative flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] bg-slate-200 sm:h-[44px] sm:w-[44px] sm:rounded-[14px]">
          <BookOpenCheck className="h-[17px] w-[17px] text-slate-500 sm:h-[19px] sm:w-[19px]" />
          <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-white">
            <Lock className="h-2.5 w-2.5 text-slate-500" />
          </span>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="text-[14px] font-medium text-slate-700 sm:text-[15px]">{ACADEMICS_PORTAL_LABEL}</h3>
          </div>
          <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-500 sm:text-[12px]">
            CBC mark entry, report cards, class rankings.
          </p>
        </div>
      </div>

      {/* Quiet locked-state strip, mirroring the sign-in CTA on active cards */}
      <div className="flex items-center justify-end gap-1 border-t border-black/[0.06] px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400 sm:text-[11px]">
          UPCOMING
        </span>
        <Lock className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
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