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
  FileText,
  DollarSign,
  Settings,
  User,
  LogOut,
  GraduationCap,
  Calendar,
  Bell,
  Receipt,
  Menu,
} from "lucide-react";

interface StudentSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  colorTheme: string;
  onLogout: () => void;
  student: any;
}

const studentNavItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
    description: "Dashboard overview and quick stats",
  },
  {
    id: "class",
    label: "My Class",
    icon: GraduationCap,
    description: "View your class information",
  },
  {
    id: "grades",
    label: "My Grades",
    icon: FileText,
    description: "View your academic performance",
  },
  {
    id: "finance",
    label: "Finances",
    icon: DollarSign,
    description: "View fees and payment history",
  },
  {
    id: "receipts",
    label: "Receipts",
    icon: Receipt,
    description: "Download payment receipts",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: Calendar,
    description: "View your attendance record",
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

export function StudentSidebar({
  activeTab,
  onTabChange,
  colorTheme,
  onLogout,
  student,
}: StudentSidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 h-screen bg-gradient-to-b from-green-900 via-green-800 to-emerald-900 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-green-700/50">
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
                  Student Portal
                </h2>
                <p className="text-green-200 text-sm truncate">
                  {student?.schoolName || "School Management"}
                </p>
              </div>
            </div>
          </div>

          {/* Student Profile */}
          <div className="p-6 border-b border-green-700/50">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-green-300 shadow-lg">
                <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                <AvatarFallback className="bg-green-600 text-white text-lg font-semibold">
                  {student?.name?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">
                  {student?.name || "Student Name"}
                </h3>
                <p className="text-green-200 text-sm truncate">
                  {student?.admissionNumber || "Admission Number"}
                </p>
                <p className="text-green-200 text-sm truncate">
                  {student?.className || "Class"}
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
              {studentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg border border-white/20"
                        : "text-green-100 hover:bg-white/10 hover:text-white"
                    }`}
                    title={item.description}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-green-300 group-hover:text-white"
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
          <div className="p-6 border-t border-green-700/50">
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
                    Are you sure you want to logout from your student account? You
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
                <Button variant="ghost" size="icon" className="hover:bg-green-50 h-12 w-12 rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <SheetTitle className="text-left text-white font-bold text-xl">Student Portal</SheetTitle>
                  <p className="text-green-100 text-sm mt-2">Hi-Tech SMS</p>
                </SheetHeader>
                
                {/* Mobile Profile Section */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-green-300 shadow-lg">
                      <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                      <AvatarFallback className="bg-green-600 text-white text-lg font-semibold">
                        {student?.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-gray-900 text-base">
                        {student?.name || "Student Name"}
                      </div>
                      <div className="text-green-700 font-semibold text-sm">
                        {student?.admissionNumber || "Admission Number"}
                      </div>
                      <div className="text-green-700 font-semibold text-sm">
                        {student?.className || "Class"}
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
                    {studentNavItems.map((item) => {
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
                            isActive ? 'bg-green-100 text-green-700 shadow-md' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
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
                          Are you sure you want to logout from your student account? You
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
              <span className="font-bold text-xl text-green-700">Student Portal</span>
              <span className="text-xs text-gray-500">
                {studentNavItems.find(item => item.id === activeTab)?.label || 'Overview'}
              </span>
            </div>
          </div>
          {student && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <span className="font-medium">{student.name}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 mobile-bottom-nav">
        <div className="flex justify-around">
          {studentNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 mobile-nav-transition ${
                  isActive 
                    ? "text-green-600 bg-green-50 nav-item-active" 
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
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