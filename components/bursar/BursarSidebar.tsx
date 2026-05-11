'use client';

import React, { useState } from "react";
import { 
  BarChart3,
  Users,
  DollarSign,
  FileText,
  Menu,
  School,
  PieChart,
  AlertCircle,
  LogOut
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    icon: BarChart3,
    description: "Overview and statistics"
  },
  { 
    id: "students", 
    label: "Student Management", 
    icon: Users,
    description: "Manage student fee records"
  },
  { 
    id: "outstanding", 
    label: "Outstanding Fees", 
    icon: AlertCircle,
    description: "Track unpaid balances"
  },
  { 
    id: "fee-structure", 
    label: "Fee Structure", 
    icon: DollarSign,
    description: "Set fees by grade and term"
  },
  { 
    id: "reports", 
    label: "Financial Reports", 
    icon: FileText,
    description: "Generate fee reports"
  },
  { 
    id: "analytics", 
    label: "Payment Analytics", 
    icon: PieChart,
    description: "Payment trends and insights"
  },
];



interface BursarSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  bursar?: any;
  schoolName?: string;
  schoolCode?: string;
  colorTheme?: string;
  summary?: {
    totalStudents: number;
    totalOutstanding: number;
    studentsWithBalance: number;
    fullyPaid: number;
  };
}

export const BursarSidebar: React.FC<BursarSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout,
  bursar,
  schoolName,
  schoolCode,
  colorTheme = "#d97706",
  summary
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const SidebarContent = () => (
    <>
      {/* Sidebar Header */}
      <div className="flex flex-col items-center p-6 border-b border-white/10 bg-slate-950">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/20"
          style={{ backgroundColor: colorTheme }}
        >
          <School className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white text-center mb-1">Bursar Portal</h2>
        <p className="text-slate-200 text-sm text-center font-medium">Financial Management</p>
        {schoolName && (
          <div className="mt-3 px-4 py-2 backdrop-blur-sm rounded-full border border-white/10" style={{ backgroundColor: `${colorTheme}22` }}>
            <span className="text-xs text-white/90 font-medium">{schoolName}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 min-h-0 flex flex-col">
        <nav className="p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Navigation</h3>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                      isActive
                        ? 'text-white shadow-lg border border-white/20'
                        : 'text-slate-200 hover:bg-white/5 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: colorTheme } : undefined}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/20 border border-white/30' 
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                    )}
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-80 z-50 bg-slate-950 border-r border-white/10 shadow-2xl flex-col backdrop-blur-xl overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
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
                <div className="h-full flex flex-col">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/20 shadow-lg" style={{ backgroundColor: colorTheme }}>
                <School className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">Bursar Portal</span>
                <div className="text-xs text-slate-300 font-medium">
                  {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </div>
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-lg z-20">
        <div className="grid grid-cols-4 gap-1 p-2">
          {NAV_ITEMS.slice(0, 4).map((item) => {
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
                <span className="text-xs font-medium truncate w-full text-center">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
