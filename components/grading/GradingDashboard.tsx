'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, User } from 'lucide-react';
import { GradingSidebar, type GradingTab } from '@/components/grading/GradingSidebar';
import { ScoreEntrySheet } from '@/components/grading/ScoreEntrySheet';
import { ClassRankingDashboard } from '@/components/grading/ClassRankingDashboard';
import { ReportCardViewer } from '@/components/grading/ReportCardViewer';
import { AcademicStructureSetup } from '@/components/grading/AcademicStructureSetup';
import { GradingScaleManager } from '@/components/grading/GradingScaleManager';
import { StudentPerformanceReview } from '@/components/grading/StudentPerformanceReview';
import { useGradingWorkflow } from '@/components/grading/useGradingWorkflow';
import { portalAccentHex, portalGlassPanelLight } from '@/components/layout/portal-glass-styles';
import { getSchoolThemeTokens, getWorkspaceThemeTokens } from '@/lib/utils/school-theme';
import { WORKFLOW_STEP_META } from '@/modules/grading-module/domain/workflow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type GradingDashboardProps = {
  schoolCode: string;
  mode?: 'grading' | 'embedded';
  skipSessionFetch?: boolean;
  sessionReady?: boolean;
};

export function GradingDashboard({
  schoolCode,
  mode = 'grading',
  skipSessionFetch = false,
  sessionReady: sessionReadyProp,
}: GradingDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GradingTab>('structure');
  const [sessionReady, setSessionReady] = useState(skipSessionFetch ? Boolean(sessionReadyProp) : false);
  const [userName, setUserName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colorTheme, setColorTheme] = useState('#2563eb');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { workflow, loading: workflowLoading, refresh: refreshWorkflow, isUnlocked } =
    useGradingWorkflow(schoolCode);

  const themeColor = portalAccentHex(colorTheme, '#2563eb');
  const theme = getSchoolThemeTokens(themeColor);
  const workspaceTheme = getWorkspaceThemeTokens(themeColor);

  const sessionEndpoint =
    mode === 'grading'
      ? `/api/schools/${schoolCode}/grading/session`
      : `/api/schools/${schoolCode}/admin/session`;

  const logoutEndpoint =
    mode === 'grading'
      ? `/api/schools/${schoolCode}/grading/logout`
      : `/api/schools/${schoolCode}/admin/logout`;

  useEffect(() => {
    if (skipSessionFetch) {
      setSessionReady(Boolean(sessionReadyProp));
      return;
    }
    fetch(sessionEndpoint, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('unauthorized');
        return r.json();
      })
      .then((data) => {
        setUserName(data.user?.name ?? '');
        setSessionReady(true);
      })
      .catch(() => {
        if (mode === 'grading') {
          router.replace(`/schools/${schoolCode}/grading/login`);
        }
      });
  }, [schoolCode, sessionEndpoint, skipSessionFetch, sessionReadyProp, mode, router]);

  useEffect(() => {
    if (!skipSessionFetch || !sessionReadyProp) return;
    fetch(sessionEndpoint, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.name) setUserName(data.user.name);
      })
      .catch(() => undefined);
  }, [skipSessionFetch, sessionReadyProp, sessionEndpoint]);

  useEffect(() => {
    fetch(`/api/schools/${schoolCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setSchoolName(data.name);
        if (typeof data.colorTheme === 'string' && /^#[0-9A-Fa-f]{6}$/.test(data.colorTheme)) {
          setColorTheme(data.colorTheme);
        }
        const logo = data.logoUrl || data.logo;
        if (typeof logo === 'string' && logo.trim()) setLogoUrl(logo.trim());
      })
      .catch(() => undefined);
  }, [schoolCode]);

  useEffect(() => {
    if (!workflow) return;
    if (!isUnlocked(activeTab)) {
      setActiveTab(workflow.nextStep);
    }
  }, [workflow, activeTab, isUnlocked]);

  const handleLogout = useCallback(async () => {
    await fetch(logoutEndpoint, { method: 'POST', credentials: 'include' });
    router.replace(mode === 'grading' ? `/schools/${schoolCode}/grading/login` : `/schools/${schoolCode}`);
  }, [logoutEndpoint, router, schoolCode, mode]);

  const handleTabChange = useCallback(
    (tab: GradingTab) => {
      if (!isUnlocked(tab)) return;
      setActiveTab(tab);
    },
    [isUnlocked]
  );

  const tabMeta = WORKFLOW_STEP_META[activeTab];
  const workflowRefresh = useCallback(() => {
    void refreshWorkflow();
  }, [refreshWorkflow]);

  const tabContent = useMemo(() => {
    const shared = { schoolCode, colorTheme: themeColor, onWorkflowChange: workflowRefresh };
    switch (activeTab) {
      case 'structure':
        return <AcademicStructureSetup {...shared} />;
      case 'scales':
        return <GradingScaleManager {...shared} />;
      case 'scores':
        return <ScoreEntrySheet {...shared} />;
      case 'rankings':
        return <ClassRankingDashboard {...shared} />;
      case 'reports':
        return <ReportCardViewer {...shared} />;
      case 'performance':
        return <StudentPerformanceReview {...shared} />;
      default:
        return null;
    }
  }, [activeTab, schoolCode, themeColor, workflowRefresh]);

  if (!sessionReady || workflowLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: `${themeColor}12` }}
      >
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: themeColor }} />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={
        {
          '--brand': themeColor,
          '--brand-12': `${workspaceTheme.primary}1f`,
          '--brand-18': `${workspaceTheme.primary}2e`,
          '--brand-24': `${workspaceTheme.primary}3d`,
          '--secondary': workspaceTheme.secondary,
          backgroundColor: `${themeColor}12`,
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.primaryDark} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${theme.primary} 0%, transparent 50%)`,
            backgroundSize: '400px 400px',
          }}
        />
      </div>

      <GradingSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        schoolName={schoolName}
        logoUrl={logoUrl}
        userName={userName}
        onLogout={handleLogout}
        colorTheme={themeColor}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        workflow={workflow}
      />

      <div
        className={`relative transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-28' : 'lg:ml-[21rem]'}`}
      >
        <div
          className="sticky top-0 z-30 mx-2 mt-2 rounded-3xl bg-gradient-to-r from-white/85 to-white/70 px-4 py-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/70 sm:px-6 sm:py-5 lg:top-2"
          style={{ border: '1px solid var(--brand-18)' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step {tabMeta.order} of 6
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: themeColor }}>
                {tabMeta.label}
              </h1>
              <p className="mt-1 text-sm font-medium" style={{ color: themeColor }}>
                {schoolName || 'Academics & Grading Workspace'}
              </p>
              <p className="mt-1 text-sm text-slate-600">{tabMeta.description}</p>
              {workflow && !workflow.steps.find((s) => s.id === activeTab)?.complete ? (
                <p className="mt-2 text-xs text-slate-500">
                  Next recommended step:{' '}
                  <button
                    type="button"
                    className="font-semibold underline"
                    style={{ color: themeColor }}
                    onClick={() => handleTabChange(workflow.nextStep)}
                  >
                    {WORKFLOW_STEP_META[workflow.nextStep].label}
                  </button>
                </p>
              ) : null}
            </div>

            <div className="hidden items-center gap-4 md:flex">
              {userName ? (
                <p className="text-right text-sm font-medium" style={{ color: themeColor }}>
                  {userName}
                </p>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white shadow-lg"
                    style={{ backgroundColor: themeColor }}
                    aria-label="Profile menu"
                  >
                    <User className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{userName || 'Academics account'}</DropdownMenuLabel>
                  <div className="px-2 pb-2 text-xs text-muted-foreground">
                    {schoolName || 'Grading workspace'}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-700 focus:text-red-800">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div
          className="min-h-[calc(100vh-8rem)] p-3 pb-24 sm:p-4 lg:p-6 lg:pb-6"
          style={{ backgroundColor: 'var(--brand-12)' }}
        >
          <div
            className={`${portalGlassPanelLight} min-h-[320px] rounded-3xl p-3 sm:p-4 lg:p-6`}
            style={{ border: '1px solid var(--brand-18)', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)' }}
          >
            {tabContent}
          </div>
        </div>
      </div>
    </div>
  );
}
