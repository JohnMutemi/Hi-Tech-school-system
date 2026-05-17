'use client';

import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  DollarSign,
  FileText,
  GraduationCap,
  Globe,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  School,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const BASE_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, description: "Overview and statistics" },
  { id: "students", label: "Student Management", icon: Users, description: "Manage student fee records" },
  { id: "outstanding", label: "Outstanding Fees", icon: AlertCircle, description: "Track unpaid balances" },
  { id: "fee-structure", label: "Fee Structure", icon: DollarSign, description: "Set fees by grade and term" },
  { id: "reports", label: "Financial Reports", icon: FileText, description: "Generate fee reports" },
  { id: "analytics", label: "Payment Analytics", icon: PieChart, description: "Payment trends and insights" },
] as const;

interface BursarSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  schoolName?: string;
  logoUrl?: string | null;
  colorTheme?: string;
  summary?: {
    totalStudents: number;
    totalOutstanding: number;
    studentsWithBalance: number;
    fullyPaid: number;
  };
  showProgression?: boolean;
  showWebsiteEditor?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  bursar?: unknown;
  schoolCode?: string;
}

export const BursarSidebar: React.FC<BursarSidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  schoolName,
  logoUrl,
  colorTheme = "#d97706",
  summary,
  showProgression = false,
  showWebsiteEditor = false,
  isCollapsed = false,
  onToggleCollapse,
  bursar: _bursar,
  schoolCode: _schoolCode,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  let navItems = [...BASE_NAV_ITEMS];
  if (showWebsiteEditor) {
    navItems = [
      ...navItems,
      {
        id: "website",
        label: "Public Website",
        icon: Globe,
        description: "Edit your school's public site",
      },
    ];
  }
  if (showProgression) {
    navItems = [
      ...navItems,
      {
        id: "progression",
        label: "Learner Progression",
        icon: GraduationCap,
        description: "Run class progression workflow",
      },
    ];
  }

  const renderSidebarBody = () => (
    <>
      <div className={`border-b border-white/15 bg-white/5 ${isCollapsed ? "px-3 py-3" : "px-4 py-4"}`}>
        <div className={`flex items-start ${isCollapsed ? "justify-center" : "justify-between gap-2"}`}>
          <div className={`flex ${isCollapsed ? "justify-center" : "items-center gap-3"} min-w-0`}>
            {logoUrl?.trim() ? (
              <img
                src={logoUrl.trim()}
                alt=""
                className="w-11 h-11 rounded-xl object-contain border border-white/20 bg-white/95 p-1 shadow-lg shrink-0"
              />
            ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0"
              style={{ backgroundColor: colorTheme }}
            >
              <School className="w-5 h-5 text-white" />
            </div>
            )}
            {!isCollapsed ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">B</span>
                  <h2 className="text-lg font-bold text-white leading-tight truncate">Bursar Portal</h2>
                </div>
                <p className="text-xs text-slate-200 font-medium">Financial Management</p>
              </div>
            ) : null}
          </div>
          {!isCollapsed && onToggleCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 text-white hover:bg-white/10 shrink-0"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {!isCollapsed && schoolName ? (
          <div
            className="mt-3 inline-flex max-w-full px-3 py-1.5 backdrop-blur-sm rounded-full border border-white/15"
            style={{ backgroundColor: `${colorTheme}22` }}
          >
            <span className="text-[11px] text-white/90 font-medium truncate">{schoolName}</span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <nav className={`overflow-y-auto ${isCollapsed ? "p-2" : "p-3"}`}>
          {!isCollapsed ? <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase">Navigation</h3> : null}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`w-full flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"} rounded-xl text-left transition-all duration-200 group ${
                      isActive ? "text-white shadow-lg border border-white/20" : "text-slate-200 hover:bg-white/5 hover:text-white"
                    }`}
                    style={isActive ? { backgroundColor: colorTheme } : undefined}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        isActive ? "bg-white/20 border border-white/30" : "bg-white/5 group-hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isCollapsed ? (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.label}</div>
                        <div className={`text-xs truncate ${isActive ? "text-white/90" : "text-slate-400"}`}>{item.description}</div>
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex fixed left-2 top-2 bottom-2 z-50 bg-slate-950/85 border border-white/15 shadow-2xl flex-col backdrop-blur-xl overflow-hidden rounded-3xl transition-all duration-300 ${
          isCollapsed ? "w-24" : "w-80"
        }`}
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

      <header className="lg:hidden bg-slate-950 shadow-lg border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/10 h-10 w-10 rounded-xl text-white border border-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-slate-950 text-white border-white/10 overflow-hidden">
                <div className="h-full flex flex-col">{renderSidebarBody()}</div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/20 shadow-lg" style={{ backgroundColor: colorTheme }}>
                <School className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">Bursar Portal</span>
                <div className="text-xs text-slate-300 font-medium">{navItems.find((item) => item.id === activeTab)?.label || "Dashboard"}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary ? (
              <Badge variant="secondary" className="hidden sm:flex text-white border-white/10 backdrop-blur-sm" style={{ backgroundColor: `${colorTheme}22` }}>
                {summary.totalStudents} Students
              </Badge>
            ) : null}
            {onLogout ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="h-9 w-9 rounded-lg border border-white/15 text-white hover:bg-red-900/40"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-lg z-20">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-200 ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
                style={isActive ? { backgroundColor: `${colorTheme}33` } : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate w-full text-center">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
