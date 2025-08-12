'use client';

import React, { useState } from "react";
import { 
  BarChart3,
  Users,
  DollarSign,
  Receipt,
  FileText,
  CreditCard,
  Menu,
  School,
  PieChart,
  AlertCircle,
  CheckCircle2
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
    id: "payments", 
    label: "Payment Processing", 
    icon: CreditCard,
    description: "Record and process payments"
  },
  { 
    id: "outstanding", 
    label: "Outstanding Fees", 
    icon: AlertCircle,
    description: "Track unpaid balances"
  },
  { 
    id: "receipts", 
    label: "Receipts & Records", 
    icon: Receipt,
    description: "View payment receipts"
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
  bursar?: any;
  schoolName?: string;
  schoolCode?: string;
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
  bursar,
  schoolName,
  schoolCode,
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
      <div className="flex flex-col items-center p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-indigo-800">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <School className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white text-center mb-1">Bursar Portal</h2>
        <p className="text-slate-300 text-sm text-center">Financial Management</p>
        {schoolName && (
          <div className="mt-3 px-3 py-1 bg-slate-700 rounded-full">
            <span className="text-xs text-slate-200">{schoolName}</span>
          </div>
        )}
      </div>

      {/* Bursar Profile */}
      {bursar && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {bursar.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'B'}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                {bursar.name || 'Bursar'}
              </div>
              <div className="text-slate-300 text-xs">
                {bursar.email || 'Financial Officer'}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Navigation Links */}
      <div className="flex-1 flex flex-col">
        <nav className="p-4">
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
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-slate-600 group-hover:bg-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
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
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-80 z-30 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900 border-r border-slate-700 shadow-2xl flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-r from-slate-900 to-indigo-900 shadow-lg border-b border-slate-700 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-800 h-10 w-10 rounded-xl text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900 text-white border-slate-700">
                <div className="h-full flex flex-col">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <School className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">Bursar Portal</span>
                <div className="text-xs text-slate-300">
                  {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </div>
              </div>
            </div>
          </div>
          {summary && (
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="bg-slate-700 text-slate-200 border-slate-600">
                {summary.totalStudents} Students
              </Badge>
              <Badge variant="destructive" className="bg-red-900 text-red-200 border-red-700">
                {formatCurrency(summary.totalOutstanding)} Outstanding
              </Badge>
            </div>
          )}
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
                  isActive 
                    ? "text-blue-400 bg-blue-900/30" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
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
