import React, { useMemo, useState } from "react";
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Sparkles,
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  LogOut,
  Menu,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  Plus,
} from "lucide-react";
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
import { getSchoolThemeTokens, hexToRgba } from "@/lib/utils/school-theme";

const NAV_SECTIONS = [
  {
    section: "MAIN",
    items: [
      { id: "overview", label: "Dashboard", icon: Sparkles },
      { id: "students", label: "Students", icon: GraduationCap },
      { id: "staff", label: "Staff & Teachers", icon: Users },
    ],
  },
  {
    section: "ACADEMICS",
    items: [
      { id: "subjects", label: "Subjects & Classes", icon: BookOpen },
      { id: "promotions", label: "Learner Progression", icon: ArrowRight },
      { id: "performance-review", label: "Performance Review", icon: BarChart3 },
      { id: "academic-calendar", label: "Academic Calendar", icon: Calendar },
    ],
  },
  {
    section: "FINANCE",
    items: [{ id: "fees", label: "Fee Management", icon: DollarSign }],
  },
  {
    section: "SYSTEM",
    items: [
      { id: "profile", label: "School Profile", icon: School },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "alumni", label: "Alumni", icon: Crown },
    ],
  },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  colorTheme?: string;
  onLogout?: () => void;
  schoolData?: any;
  /** School logo (data URL or https). Falls back to platform mark. */
  logoUrl?: string | null;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  colorTheme,
  onLogout,
  schoolData,
  logoUrl,
  onCollapseChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const theme = getSchoolThemeTokens(colorTheme);
  const mobileItems = useMemo(
    () => NAV_SECTIONS.flatMap((section) => section.items),
    []
  );

  const resolvedLogo =
    (typeof logoUrl === "string" && logoUrl.trim()) ||
    (schoolData && (schoolData.logoUrl || schoolData.logo)) ||
    "";

  React.useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={`hidden lg:flex fixed left-0 top-0 h-full z-30 border-r flex-col py-6 px-4 transition-all duration-300 shadow-lg ${
          isCollapsed ? "w-24" : "w-72"
        }`}
        style={{
          minHeight: '100vh',
          borderColor: hexToRgba(theme.primary, 0.3),
          background: `linear-gradient(to bottom, ${theme.primaryDeeper}, ${theme.primaryDark})`,
          boxShadow: `0 20px 45px ${hexToRgba(theme.primaryDeeper, 0.45)}`,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo section at the top */}
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} h-20 mb-4`}>
            <img 
              src={resolvedLogo || "/hi-tech-logo.svg"} 
              alt="School logo" 
              className={`w-auto rounded-xl border-2 shadow-lg p-2 transition-all ${isCollapsed ? "h-12" : "h-16"}`} 
              style={{ borderColor: colorTheme || '#3b82f6' }}
            />
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/90 hover:bg-white/15 hover:text-white"
                onClick={() => setIsCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            )}
          </div>
          {isCollapsed && (
            <div className="mb-3 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/90 hover:bg-white/15 hover:text-white"
                onClick={() => setIsCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* School Info */}
          {schoolData && !isCollapsed && (
            <div className="mb-6 px-4">
              <div className="text-center">
                <div className="font-bold text-white text-base">
                  {schoolData.name}
                </div>
                <div className="font-semibold text-sm" style={{ color: hexToRgba("#ffffff", 0.78) }}>
                  School Portal
                </div>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.section} className="space-y-1">
                  {!isCollapsed && (
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.2em] text-white/65">
                      {section.section}
                    </p>
                  )}
                  <ul className="flex flex-col gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            className={`group relative w-full flex items-center ${
                              isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                            } py-2.5 rounded-xl text-left transition-all duration-200 ${
                              isActive ? "font-semibold shadow-md" : "font-medium"
                            }`}
                            style={{
                              color: isActive ? "#ffffff" : hexToRgba("#ffffff", 0.85),
                              background: isActive
                                ? hexToRgba(theme.primary, 0.35)
                                : "transparent",
                            }}
                            onClick={() => onTabChange(item.id)}
                            aria-current={isActive ? "page" : undefined}
                            title={isCollapsed ? item.label : undefined}
                          >
                            {isActive && (
                              <span
                                className="absolute left-0 top-1/2 h-7 -translate-y-1/2 rounded-r-full"
                                style={{ width: "3px", backgroundColor: theme.primaryLight }}
                              />
                            )}
                            <Icon className="w-5 h-5 shrink-0" />
                            {!isCollapsed && (
                              <span className="text-sm tracking-tight">{item.label}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="mt-4 mb-3 space-y-2">
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.2em] text-white/65">
                QUICK ACTIONS
              </p>
            )}
            {isCollapsed && (
              <div className="flex justify-center mb-2">
                <button
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: hexToRgba(theme.primaryLight, 0.55) }}
                  onClick={() => onTabChange("students")}
                  title="Quick add student"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
            <button
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-white/90 hover:text-white transition-colors`}
              style={{ backgroundColor: hexToRgba(theme.primary, 0.28) }}
              onClick={() => onTabChange("students")}
              title={isCollapsed ? "Add Student" : undefined}
            >
              <Plus className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">Add Student</span>}
            </button>
            <button
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-white/90 hover:text-white transition-colors`}
              style={{ backgroundColor: hexToRgba(theme.primary, 0.28) }}
              onClick={() => onTabChange("staff")}
              title={isCollapsed ? "Add Teacher" : undefined}
            >
              <UserPlus className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">Add Teacher</span>}
            </button>
            <button
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-white/90 hover:text-white transition-colors`}
              style={{ backgroundColor: hexToRgba(theme.primary, 0.28) }}
              onClick={() => onTabChange("subjects")}
              title={isCollapsed ? "Create Class" : undefined}
            >
              <BookOpen className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">Create Class</span>}
            </button>
          </div>

          {/* Logout button at the bottom */}
          {onLogout && (
            <div className="mt-auto pt-4 border-t" style={{ borderColor: hexToRgba("#ffffff", 0.2) }}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} w-full px-3 py-2.5 rounded-xl hover:bg-white/10 transition group text-white/80 hover:text-white font-medium`}
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span>Logout</span>}
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
      <header className="lg:hidden shadow-sm border-b sticky top-0 z-20 bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" style={{ color: theme.primaryDark }}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader
                  className="p-6 border-b text-white"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                >
                  <SheetTitle className="text-left text-white font-bold text-lg">School Portal</SheetTitle>
                  <p className="text-sm mt-1" style={{ color: hexToRgba("#ffffff", 0.82) }}>Hi-Tech SMS</p>
                </SheetHeader>
                
                {/* Mobile School Info */}
                {schoolData && (
                  <div className="p-6 border-b bg-gray-50">
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-base">
                        {schoolData.name}
                      </div>
                      <div className="font-semibold text-sm" style={{ color: theme.primary }}>
                        School Portal
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation */}
                <nav className="flex-1 py-6">
                  <div className="space-y-4">
                    {NAV_SECTIONS.map((section) => (
                      <div key={section.section}>
                        <p className="px-6 pb-1 text-[11px] font-semibold tracking-[0.2em] text-gray-500">
                          {section.section}
                        </p>
                        <ul className="flex flex-col gap-1">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <li key={item.id}>
                                <button
                                  className={`relative w-full flex items-center gap-4 px-6 py-3 rounded-lg text-left transition-colors font-medium mx-3 ${
                                    isActive ? 'shadow-sm' : ''
                                  }`}
                                  style={{
                                    backgroundColor: isActive ? hexToRgba(theme.primary, 0.14) : undefined,
                                    color: isActive ? theme.primaryDark : undefined,
                                  }}
                                  onClick={() => {
                                    onTabChange(item.id);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  aria-current={isActive ? "page" : undefined}
                                >
                                  {isActive && (
                                    <span
                                      className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full"
                                      style={{ width: "3px", backgroundColor: theme.primary }}
                                    />
                                  )}
                                  <Icon className="w-5 h-5" />
                                  <span className="text-sm">{item.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
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
              <span className="font-bold text-lg" style={{ color: theme.primaryDark }}>School Portal</span>
              <span className="text-xs text-gray-500">
                {mobileItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
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
          {mobileItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 mobile-nav-transition ${isActive ? "nav-item-active" : "text-gray-600"}`}
                style={{
                  color: isActive ? theme.primary : undefined,
                  backgroundColor: isActive ? hexToRgba(theme.primary, 0.12) : undefined,
                }}
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