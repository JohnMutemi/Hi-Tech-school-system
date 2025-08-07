import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User, Lock, Bell, Settings } from "lucide-react";

interface SettingsSectionProps {
  parent?: any;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  passwordMsg?: string;
  setOldPassword?: (v: string) => void;
  setNewPassword?: (v: string) => void;
  setConfirmPassword?: (v: string) => void;
  setPasswordMsg?: (v: string) => void;
  handleLogout?: () => void;
}

export default function SettingsSection({
  parent = {},
  oldPassword = "",
  newPassword = "",
  confirmPassword = "",
  passwordMsg = "",
  setOldPassword,
  setNewPassword,
  setConfirmPassword,
  setPasswordMsg,
  handleLogout,
}: SettingsSectionProps) {
  const safeParent = parent || {};
  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Profile Information Card */}
      <Card className="bg-gradient-to-br from-cyan-50/90 via-blue-50/90 to-teal-50/90 border-cyan-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-cyan-800 text-xl">
            <User className="w-7 h-7 text-cyan-600" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/70 rounded-lg p-4 border border-cyan-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Full Name</label>
              <Input 
                value={safeParent.parentName || safeParent.name || ""} 
                disabled 
                className="bg-gray-50 border-gray-200 text-gray-900 font-medium text-lg"
              />
            </div>
            <div className="bg-white/70 rounded-lg p-4 border border-cyan-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Phone Number</label>
              <Input 
                value={safeParent.parentPhone || safeParent.phone || ""} 
                disabled 
                className="bg-gray-50 border-gray-200 text-gray-900 font-medium text-lg"
              />
            </div>
            <div className="bg-white/70 rounded-lg p-4 border border-cyan-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Email Address</label>
              <Input 
                value={safeParent.parentEmail || safeParent.email || ""} 
                disabled 
                className="bg-gray-50 border-gray-200 text-gray-900 font-medium text-lg"
              />
            </div>
            <div className="bg-white/70 rounded-lg p-4 border border-cyan-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Account Status</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                  Active
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="bg-gradient-to-br from-blue-50/90 via-cyan-50/90 to-indigo-50/90 border-blue-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-blue-800 text-xl">
            <Lock className="w-7 h-7 text-blue-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Current Password</label>
              <Input 
                type="password" 
                value={oldPassword} 
                onChange={e => setOldPassword && setOldPassword(e.target.value)}
                className="border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 text-lg font-medium transition-all duration-200"
                placeholder="Enter your current password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">New Password</label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword && setNewPassword(e.target.value)}
                  className="border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 text-lg font-medium transition-all duration-200"
                  placeholder="Enter new password"
                />
              </div>
              <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Confirm Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword && setConfirmPassword(e.target.value)}
                  className="border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 text-lg font-medium transition-all duration-200"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>
          {passwordMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium">{passwordMsg}</div>
            </div>
          )}
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Preferences Card */}
      <Card className="bg-gradient-to-br from-indigo-50/90 via-cyan-50/90 to-blue-50/90 border-indigo-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-indigo-800 text-xl">
            <Bell className="w-7 h-7 text-indigo-600" />
            Notifications & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white/70 rounded-lg p-6 border border-indigo-100">
            <div className="text-center py-8">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">Notification Settings</p>
              <p className="text-gray-400 text-sm mt-2">Email and SMS notification preferences will be available soon.</p>
              <div className="mt-6">
                <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50" disabled>
                  <Bell className="w-4 h-4 mr-2" />
                  Configure Notifications
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions Card */}
      {handleLogout && (
        <Card className="bg-gradient-to-br from-red-50/90 via-pink-50/90 to-rose-50/90 border-red-200/60 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-red-800 text-xl">
              <LogOut className="w-7 h-7 text-red-600" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 rounded-lg p-6 border border-red-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">Sign Out</h4>
                  <p className="text-gray-600 text-sm mt-1">Securely log out of your parent portal account.</p>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 