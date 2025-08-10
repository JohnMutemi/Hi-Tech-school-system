import React, { useState } from "react";
import { School, Users, GraduationCap, BookOpen, DollarSign, Sparkles, Calendar, Settings, ArrowRight, LogOut, Menu, Crown } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "profile", label: "School Profile", icon: School },
  { id: "staff", label: "Staff & Teachers", icon: Users },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "subjects", label: "Subjects & Classes", icon: BookOpen },
  { id: "fees", label: "Fee Management", icon: DollarSign },
  { id: "promotions", label: "Promotions", icon: ArrowRight },
  { id: "alumni", label: "Alumni", icon: Crown },
  { id: "academic-calendar", label: "Academic Calendar", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  colorTheme?: string;
  onLogout?: () => void;
  schoolData?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, colorTheme, onLogout, schoolData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use system color mode (light/dark)
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const sidebarBg = isDark
    ? 'bg-gradient-to-b from-blue-950 via-blue-900 to-neutral-900'
    : 'bg-gradient-to-b from-blue-100 via-white to-blue-200';
  const sidebarBorder = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const sidebarShadow = isDark ? 'shadow-lg shadow-black/20' : 'shadow-lg shadow-blue-200/40';

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={`hidden lg:flex fixed left-0 top-0 h-full w-64 z-30 ${sidebarBg} ${sidebarBorder} ${sidebarShadow} border-r flex-col py-6 px-4 transition-all duration-300`}
        style={{ minHeight: '100vh' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo section at the top */}
          <div className="flex items-center justify-center h-20 mb-8">
            <img 
              src="/hi-tech-logo.svg" 
              alt="Logo" 
              className="h-16 w-auto rounded-xl border-2 shadow-lg p-2" 
              style={{ borderColor: colorTheme || '#3b82f6' }}
            />
          </div>

          {/* School Info */}
          {schoolData && (
            <div className="mb-6 px-4">
              <div className="text-center">
                <div className="font-bold text-gray-900 text-base">
                  {schoolData.name}
                </div>
                <div className="text-blue-700 font-semibold text-sm">
                  School Portal
                </div>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors font-semibold text-gray-700 dark:text-gray-200 hover:underline hover:text-blue-700 dark:hover:text-blue-400 ${
                        isActive ? 'font-bold bg-blue-50 text-blue-700' : 'font-medium'
                      }`}
                      style={isActive && colorTheme ? { color: colorTheme } : {}}
                      onClick={() => onTabChange(item.id)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm tracking-tight">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout button at the bottom */}
          {onLogout && (
            <div className="mt-6 mb-4 flex flex-col items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-100 transition group text-red-600 font-medium"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
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

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-blue-50 h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <SheetTitle className="text-left text-white font-bold text-lg">School Portal</SheetTitle>
                  <p className="text-blue-100 text-sm mt-1">Hi-Tech SMS</p>
                </SheetHeader>
                
                {/* Mobile School Info */}
                {schoolData && (
                  <div className="p-6 border-b bg-gray-50">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-base">
                        {schoolData.name}
                      </div>
                      <div className="text-blue-700 font-semibold text-sm">
                        School Portal
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation */}
                <nav className="flex-1 py-6">
                  <ul className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-left transition-colors font-medium mx-3 ${
                              isActive ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                            onClick={() => {
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm">{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Mobile Logout */}
                {onLogout && (
                  <div className="p-6 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors justify-center"
                        >
                          <LogOut className="w-5 h-5" />
                          Logout
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
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-blue-700">School Portal</span>
              <span className="text-xs text-gray-500">
                {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Overview'}
              </span>
            </div>
          </div>
          {schoolData && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <span className="font-medium">{schoolData.name}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 mobile-bottom-nav">
        <div className="flex justify-around">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 mobile-nav-transition ${
                  isActive 
                    ? "text-blue-600 bg-blue-50 nav-item-active" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}; 