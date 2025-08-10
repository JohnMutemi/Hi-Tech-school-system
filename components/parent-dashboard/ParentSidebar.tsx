import React, { useState } from "react";
import { 
  Sparkles, 
  Users, 
  DollarSign, 
  // Receipt, 
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
  // { id: "receipts", label: "Receipts", icon: Receipt },
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
  const sidebarBg = 'bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900';
  const sidebarBorder = 'border-slate-800';
  const sidebarShadow = 'shadow-lg shadow-indigo-900/40';

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={`hidden lg:flex fixed left-0 top-0 h-full w-64 z-30 ${sidebarBg} ${sidebarBorder} ${sidebarShadow} border-r flex-col py-6 px-4 transition-all duration-300`}
        style={{ minHeight: '100vh' }}
      >
        <div className="flex flex-col h-full">
          {/* HT Logo at the far top left */}
          <div className="flex items-start justify-start mb-6">
            <img src="/hi-tech-logo.svg" alt="HT Logo" className="w-14 h-14 p-1" />
          </div>
          {/* Sidebar Header (no logo) */}
          <div className="flex flex-col items-center justify-center h-20 mb-4 mt-2 border-b border-slate-700 pb-4">
            <span className="font-bold text-2xl text-white tracking-tight">Parent Portal</span>
            <span className="text-slate-300 text-sm mt-1">School Management</span>
            {parent?.parentName && (
              <span className="text-slate-200 text-base mt-2">Hello, {parent.parentName}!</span>
            )}
          </div>

          {/* Parent Profile Section */}
          {parent && (
            <div className="flex flex-col items-center mb-8 px-4">
              
              <div className="text-center mt-3">
                <div className="font-bold text-white text-lg">
                  {parent.parentName}
                </div>
                <div className="text-slate-300 font-semibold text-sm">
                  {parent.parentPhone}
                </div>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto mt-4">
            <ul className="flex flex-col gap-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors font-semibold text-slate-200 hover:underline hover:text-white ${
                        isActive ? 'font-bold bg-indigo-700 text-white shadow-md' : 'font-medium'
                      }`}
                      style={isActive ? { boxShadow: '0 0 0 2px #6366f1' } : {}}
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
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-100 transition group text-red-600 font-medium"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-base font-semibold">Logout</span>
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
      <header className="lg:hidden bg-slate-900 shadow-sm border-b border-slate-800 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-800 h-12 w-12 rounded-xl text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900 text-white">
                <SheetHeader className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-indigo-800 text-white">
                  <SheetTitle className="text-left text-white font-bold text-xl">Parent Portal</SheetTitle>
                  <p className="text-slate-300 text-sm mt-2">Hi-Tech SMS</p>
                </SheetHeader>
                {/* Mobile Profile Section */}
                {parent && (
                  <div className="p-6 border-b border-slate-700 bg-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 rounded-xl border-2 shadow-lg ring-4 ring-slate-300">
                          <img
                            src={avatarUrl || "/placeholder-user.jpg"}
                            alt={parent.parentName || "Parent Avatar"}
                            className="rounded-xl object-cover w-full h-full"
                          />
                          {onAvatarChange && (
                            <label
                              className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 cursor-pointer shadow-md"
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
                        <div className="font-bold text-white text-base">
                          {parent.parentName}
                        </div>
                        <div className="text-slate-300 font-semibold text-sm">
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
                              isActive ? 'bg-indigo-700 text-white shadow-md' : 'text-slate-200 hover:bg-indigo-700 hover:text-white'
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
              <span className="font-bold text-xl text-slate-200">Parent Portal</span>
              <span className="text-xs text-slate-300">
                {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Overview'}
              </span>
            </div>
          </div>
          {parent && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-200 bg-slate-800 px-3 py-2 rounded-full">
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
                    ? "text-indigo-600 bg-indigo-50 nav-item-active" 
                    : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
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