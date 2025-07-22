import React, { useState } from "react";
import { 
  Sparkles, 
  Users, 
  DollarSign, 
  Receipt, 
  BarChart2, 
  Settings, 
  LogOut,
  Camera,
  Menu,
  X
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
import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "children", label: "My Children", icon: Users },
  { id: "fees", label: "Fee Management", icon: DollarSign },
  { id: "receipts", label: "Payment History", icon: Receipt },
  { id: "performance", label: "Academic Performance", icon: BarChart2 },
  { id: "settings", label: "Account Settings", icon: Settings },
];

interface ParentSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  colorTheme?: string;
  onLogout?: () => void;
  parent?: any;
  onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarUploading?: boolean;
  avatarError?: string;
  avatarUrl?: string | null;
}

export const ParentSidebar: React.FC<ParentSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  colorTheme,
  onLogout,
  parent,
  onAvatarChange,
  avatarUploading,
  avatarError,
  avatarUrl
}) => {
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

          {/* Parent Profile Section */}
          {parent && (
            <div className="flex flex-col items-center mb-8 px-4">
              <div className="relative group">
                <Avatar className="w-20 h-20 rounded-xl border-2 shadow-lg ring-4 ring-blue-200">
                  <img
                    src={avatarUrl || "/placeholder-user.jpg"}
                    alt={parent.parentName || "Parent Avatar"}
                    className="rounded-xl object-cover w-full h-full"
                  />
                  {onAvatarChange && (
                    <label
                      className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer shadow-md group-hover:scale-110 transition"
                      title="Change profile picture"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onAvatarChange}
                        disabled={avatarUploading}
                      />
                      <Camera className="w-3 h-3" />
                    </label>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                      <span className="text-blue-600 text-xs font-bold">Uploading...</span>
                    </div>
                  )}
                </Avatar>
                {avatarError && (
                  <div className="absolute left-0 right-0 -bottom-6 text-xs text-red-600 text-center">
                    {avatarError}
                  </div>
                )}
              </div>
              <div className="text-center mt-3">
                <div className="font-bold text-gray-900 text-base">
                  {parent.parentName}
                </div>
                <div className="text-blue-700 font-semibold text-sm">
                  {parent.parentPhone}
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
                      Are you sure you want to logout? You will need to login again to access the dashboard.
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
                <Button variant="ghost" size="icon" className="hover:bg-blue-50 h-12 w-12 rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <SheetTitle className="text-left text-white font-bold text-xl">Parent Portal</SheetTitle>
                  <p className="text-blue-100 text-sm mt-2">Hi-Tech SMS</p>
                </SheetHeader>
                
                {/* Mobile Profile Section */}
                {parent && (
                  <div className="p-6 border-b bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 rounded-xl border-2 shadow-lg">
                          <img
                            src={avatarUrl || "/placeholder-user.jpg"}
                            alt={parent.parentName || "Parent Avatar"}
                            className="rounded-xl object-cover w-full h-full"
                          />
                          {onAvatarChange && (
                            <label
                              className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md"
                              title="Change profile picture"
                            >
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onAvatarChange}
                                disabled={avatarUploading}
                              />
                              <Camera className="w-3 h-3" />
                            </label>
                          )}
                        </Avatar>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-base">
                          {parent.parentName}
                        </div>
                        <div className="text-blue-700 font-semibold text-sm">
                          {parent.parentPhone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation */}
                <nav className="flex-1 py-6">
                  <ul className="flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-left transition-colors font-medium mx-3 ${
                              isActive ? 'bg-blue-100 text-blue-700 shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                            onClick={() => {
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <Icon className="w-6 h-6" />
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
                            Are you sure you want to logout? You will need to login again to access the dashboard.
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
              <span className="font-bold text-xl text-blue-700">Parent Portal</span>
              <span className="text-xs text-gray-500">
                {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Overview'}
              </span>
            </div>
          </div>
          {parent && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <span className="font-medium">{parent.parentName}</span>
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
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}; 