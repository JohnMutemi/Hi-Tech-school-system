'use client';

import { useState } from 'react';
import {
  BookOpenCheck,
  ClipboardList,
  FileText,
  Layers,
  Lock,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  GRADING_WORKFLOW_STEPS,
  WORKFLOW_STEP_META,
  type GradingTab,
  type GradingWorkflowSnapshot,
} from '@/modules/grading-module/domain/workflow';

export type { GradingTab };

type GradingSidebarProps = {
  activeTab: GradingTab;
  onTabChange: (tab: GradingTab) => void;
  schoolName?: string;
  logoUrl?: string | null;
  userName?: string;
  onLogout: () => void;
  colorTheme?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  workflow?: GradingWorkflowSnapshot | null;
};

const TAB_ICONS: Record<GradingTab, typeof ClipboardList> = {
  structure: Settings2,
  scales: Layers,
  scores: ClipboardList,
  rankings: Trophy,
  reports: FileText,
  performance: Users,
};

const MOBILE_SHORT: Record<GradingTab, string> = {
  structure: 'Setup',
  scales: 'Scales',
  scores: 'Scores',
  rankings: 'Ranks',
  reports: 'Reports',
  performance: 'Review',
};

export function GradingSidebar({
  activeTab,
  onTabChange,
  schoolName,
  logoUrl,
  userName,
  onLogout,
  colorTheme = '#2563eb',
  isCollapsed = false,
  onToggleCollapse,
  workflow,
}: GradingSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = GRADING_WORKFLOW_STEPS.map((id) => {
    const step = workflow?.steps.find((item) => item.id === id);
    return {
      id,
      order: WORKFLOW_STEP_META[id].order,
      label: WORKFLOW_STEP_META[id].label,
      description: WORKFLOW_STEP_META[id].description,
      shortLabel: MOBILE_SHORT[id],
      icon: TAB_ICONS[id],
      unlocked: step?.unlocked ?? id === 'structure',
      complete: step?.complete ?? false,
    };
  });

  const handleTabClick = (tab: GradingTab, unlocked: boolean) => {
    if (!unlocked) return;
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarBody = () => (
    <>
      <div className={cn('border-b border-white/15 bg-white/5', isCollapsed ? 'px-3 py-3' : 'px-4 py-4')}>
        <div className={cn('flex items-start', isCollapsed ? 'justify-center' : 'justify-between gap-2')}>
          <div className={cn('flex min-w-0', isCollapsed ? 'justify-center' : 'items-center gap-3')}>
            {logoUrl?.trim() ? (
              <img
                src={logoUrl.trim()}
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl border border-white/20 bg-white/95 p-1 object-contain shadow-lg"
              />
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 shadow-lg"
                style={{ backgroundColor: colorTheme }}
              >
                <BookOpenCheck className="h-5 w-5 text-white" />
              </div>
            )}
            {!isCollapsed ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                    A
                  </span>
                  <h2 className="truncate text-lg font-bold leading-tight text-white">Academics Portal</h2>
                </div>
                <p className="text-xs font-medium text-slate-200">Guided grading workflow</p>
              </div>
            ) : null}
          </div>
          {!isCollapsed && onToggleCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 shrink-0 text-white hover:bg-white/10"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {!isCollapsed && schoolName ? (
          <div
            className="mt-3 inline-flex max-w-full rounded-full border border-white/15 px-3 py-1.5 backdrop-blur-sm"
            style={{ backgroundColor: `${colorTheme}22` }}
          >
            <span className="truncate text-[11px] font-medium text-white/90">{schoolName}</span>
          </div>
        ) : null}
        {!isCollapsed && userName ? (
          <p className="mt-2 truncate text-xs text-slate-300">{userName}</p>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <nav className={cn('overflow-y-auto', isCollapsed ? 'p-2' : 'p-3')}>
          {!isCollapsed ? (
            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-300">Workflow</h3>
          ) : null}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const locked = !item.unlocked;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={locked}
                    className={cn(
                      'group flex w-full items-center rounded-xl text-left transition-all duration-200',
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                      locked && 'cursor-not-allowed opacity-50',
                      isActive
                        ? 'border border-white/20 text-white shadow-lg'
                        : 'text-slate-200 hover:bg-white/5 hover:text-white'
                    )}
                    style={isActive ? { backgroundColor: colorTheme } : undefined}
                    onClick={() => handleTabClick(item.id, item.unlocked)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                        isActive ? 'border border-white/30 bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                      )}
                    >
                      {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    {!isCollapsed ? (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                            Step {item.order}
                          </span>
                          {item.complete ? (
                            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Done
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-sm font-medium">{item.label}</div>
                        <div className={cn('truncate text-xs', isActive ? 'text-white/90' : 'text-slate-400')}>
                          {locked ? 'Complete the previous step first' : item.description}
                        </div>
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className={cn('border-t border-white/10', isCollapsed ? 'p-2' : 'p-3')}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2 text-slate-200 hover:bg-red-900/30 hover:text-white',
            isCollapsed && 'justify-center px-2'
          )}
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed ? 'Sign out' : null}
        </Button>
      </div>
    </>
  );

  const activeItem = navItems.find((item) => item.id === activeTab);

  return (
    <>
      <aside
        className={cn(
          'fixed bottom-2 left-2 top-2 z-50 hidden flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/85 shadow-2xl backdrop-blur-xl transition-all duration-300 lg:flex',
          isCollapsed ? 'w-24' : 'w-80'
        )}
      >
        {isCollapsed && onToggleCollapse ? (
          <div className="flex justify-center pt-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 text-white hover:bg-white/10"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {renderSidebarBody()}
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950 shadow-lg lg:hidden">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl border border-white/10 text-white hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 overflow-hidden border-white/10 bg-slate-950 p-0 text-white"
              >
                <div className="flex h-full flex-col">{renderSidebarBody()}</div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 shadow-lg"
                style={{ backgroundColor: colorTheme }}
              >
                <BookOpenCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">Academics Portal</span>
                <div className="text-xs font-medium text-slate-300">{activeItem?.label ?? 'Workflow'}</div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-9 w-9 rounded-lg border border-white/15 text-white hover:bg-red-900/40"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-700 bg-slate-900 shadow-lg lg:hidden">
        <div className="grid grid-cols-6 gap-0.5 p-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const locked = !item.unlocked;
            return (
              <button
                key={item.id}
                type="button"
                disabled={locked}
                onClick={() => handleTabClick(item.id, item.unlocked)}
                className={cn(
                  'flex flex-col items-center rounded-lg px-0.5 py-1.5 transition-all duration-200',
                  locked && 'opacity-40',
                  isActive ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
                style={isActive ? { backgroundColor: `${colorTheme}33` } : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {locked ? <Lock className="mb-0.5 h-4 w-4" /> : <Icon className="mb-0.5 h-4 w-4" />}
                <span className="w-full truncate text-center text-[9px] font-medium">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
