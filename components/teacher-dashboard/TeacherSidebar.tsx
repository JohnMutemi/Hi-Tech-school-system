"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  BookOpen,
  Users,
  Settings,
  User,
  LogOut,
  GraduationCap,
  FileText,
  Calendar,
  Bell,
  Menu,
} from "lucide-react";

interface TeacherSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  colorTheme: string;
  onLogout: () => void;
  teacher: any;
}

const teacherNavItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
    description: "Dashboard overview and quick stats",
  },
  {
    id: "classes",
    label: "My Classes",
    icon: GraduationCap,
    description: "Manage your assigned classes",
  },
  {
    id: "subjects",
    label: "My Subjects",
    icon: FileText,
    description: "View and manage your subjects",
  },
  {
    id: "students",
    label: "My Students",
    icon: Users,
    description: "View and manage your students",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: Calendar,
    description: "Track student attendance",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "View school announcements",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Account and profile settings",
  },
];

export function TeacherSidebar({
  activeTab,
  onTabChange,
  colorTheme,
  onLogout,
  teacher,
}: TeacherSidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-blue-700/50">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                style={{
                  backgroundColor: colorTheme + "20",
                  borderColor: colorTheme,
                }}
              >
                <GraduationCap className="w-8 h-8" style={{ color: colorTheme }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">
                  Teacher Portal
                </h2>
                <p className="text-blue-200 text-sm truncate">
                  {teacher?.schoolName || "School Management"}
                </p>
              </div>
            </div>
          </div>

          {/* Teacher Profile */}
          <div className="p-6 border-b border-blue-700/50">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-blue-300 shadow-lg">
                <AvatarImage src={teacher?.avatarUrl} alt={teacher?.name} />
                <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                  {teacher?.name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">
                  {teacher?.name || "Teacher Name"}
                </h3>
                <p className="text-blue-200 text-sm truncate">
                  {teacher?.email || "teacher@school.edu"}
                </p>
                <div className="flex items-center mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 text-xs"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-4">
              {teacherNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg border border-white/20"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                    title={item.description}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-blue-300 group-hover:text-white"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div
                        className="w-1 h-6 rounded-full ml-auto"
                        style={{ backgroundColor: colorTheme }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout Section */}
          <div className="p-6 border-t border-blue-700/50">
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-200 hover:text-red-100 hover:bg-red-500/20 border border-red-500/30"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout from your teacher account? You
                    will need to login again to access the dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-blue-50 h-12 w-12 rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <SheetTitle className="text-left text-white font-bold text-xl">Teacher Portal</SheetTitle>
                  <p className="text-blue-100 text-sm mt-2">Hi-Tech SMS</p>
                </SheetHeader>
                
                {/* Mobile Profile Section */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-blue-300 shadow-lg">
                      <AvatarImage src={teacher?.avatarUrl} alt={teacher?.name} />
                      <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                        {teacher?.name?.charAt(0) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-gray-900 text-base">
                        {teacher?.name || "Teacher Name"}
                      </div>
                      <div className="text-blue-700 font-semibold text-sm">
                        {teacher?.email || "teacher@school.edu"}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs mt-1">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 py-6">
                  <div className="space-y-2">
                    {teacherNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-left transition-colors font-medium mx-3 ${
                            isActive ? 'bg-blue-100 text-blue-700 shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>

                {/* Mobile Logout */}
                <div className="p-6 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors justify-center"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to logout from your teacher account? You
                          will need to login again to access the dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onLogout}>Logout</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-blue-700">Teacher Portal</span>
              <span className="text-xs text-gray-500">
                {teacherNavItems.find(item => item.id === activeTab)?.label || 'Overview'}
              </span>
            </div>
          </div>
          {teacher && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <span className="font-medium">{teacher.name}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 mobile-bottom-nav">
        <div className="flex justify-around">
          {teacherNavItems.slice(0, 4).map((item) => {
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
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
} 