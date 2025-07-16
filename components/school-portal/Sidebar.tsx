import React from "react";
import { School, Users, GraduationCap, BookOpen, DollarSign, Sparkles, Calendar, Settings, ArrowRight, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "profile", label: "School Profile", icon: School },
  { id: "staff", label: "Staff & Teachers", icon: Users },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "subjects", label: "Subjects & Classes", icon: BookOpen },
  { id: "fees", label: "Fee Management", icon: DollarSign },
  { id: "promotions", label: "Promotions", icon: ArrowRight },
  { id: "academic-calendar", label: "Academic Calendar", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  colorTheme?: string;
  onLogout?: () => void; // <-- add this
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, colorTheme, onLogout }) => {
  // Use system color mode (light/dark)
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const sidebarBg = isDark
    ? 'bg-gradient-to-b from-blue-950 via-blue-900 to-neutral-900'
    : 'bg-gradient-to-b from-blue-100 via-white to-blue-200';
  const sidebarBorder = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const sidebarShadow = isDark ? 'shadow-lg shadow-black/20' : 'shadow-lg shadow-blue-200/40';
  return (
    <nav
      className={`fixed left-0 top-0 h-full w-20 md:w-56 z-30 ${sidebarBg} ${sidebarBorder} ${sidebarShadow} border-r flex flex-col py-4 px-2 transition-all duration-300`}
      style={{ minHeight: '100vh' }}
    >
      <div className="flex flex-col h-full">
        {/* Logo section at the top */}
        <div className="flex items-center justify-center h-24 mb-6">
          <img 
            src="/hi-tech-logo.svg" 
            alt="Logo" 
            className="h-14 w-auto rounded-xl border-2 shadow-lg p-1" 
            style={{ borderColor: colorTheme || '#3b82f6' }}
          />
        </div>
        {/* Navigation links (scrollable if needed) */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-2 mt-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors font-semibold text-gray-700 dark:text-gray-200 hover:underline hover:text-blue-700 dark:hover:text-blue-400 ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                    style={isActive && colorTheme ? { color: colorTheme } : {}}
                    onClick={() => onTabChange(item.id)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden md:inline text-sm tracking-tight">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Logout button at the bottom */}
        {onLogout && (
          <div className="mt-6 mb-2 flex flex-col items-center relative">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-3 rounded-full hover:bg-red-100 transition group flex items-center relative"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6 text-red-600" />
                  <span className="ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:inline-block absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap z-10">Logout</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </nav>
  );
}; 