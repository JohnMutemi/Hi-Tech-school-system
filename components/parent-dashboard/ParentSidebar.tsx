import React from "react";
import { 
  Sparkles, 
  Users, 
  DollarSign, 
  Receipt, 
  BarChart2, 
  Settings, 
  LogOut,
  Camera
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

        {/* Parent Profile Section */}
        {parent && (
          <div className="flex flex-col items-center mb-6 px-2">
            <div className="relative group">
              <Avatar className="w-16 h-16 rounded-xl border-2 shadow-lg ring-4 ring-blue-200">
                <img
                  src={avatarUrl || "/placeholder-user.jpg"}
                  alt={parent.parentName || "Parent Avatar"}
                  className="rounded-xl object-cover w-full h-full"
                />
                {onAvatarChange && (
                  <label
                    className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition"
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
            <div className="text-center mt-2">
              <div className="font-bold text-gray-900 text-sm hidden md:block">
                {parent.parentName}
              </div>
              <div className="text-blue-700 font-semibold text-xs hidden md:block">
                {parent.parentPhone}
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
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
  );
}; 