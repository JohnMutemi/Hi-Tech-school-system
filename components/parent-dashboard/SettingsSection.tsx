import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";

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
    <div className="space-y-8 max-w-xl mx-auto">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow">
        <CardHeader>
          <CardTitle className="text-green-800">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <Input value={safeParent.parentName || ""} disabled />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Phone</label>
            <Input value={safeParent.parentPhone || ""} disabled />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 shadow">
        <CardHeader>
          <CardTitle className="text-blue-800">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Old Password</label>
            <Input type="password" value={oldPassword} onChange={e => setOldPassword && setOldPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">New Password</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword && setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Confirm New Password</label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword && setConfirmPassword(e.target.value)} />
          </div>
          {passwordMsg && <div className="text-xs text-red-600">{passwordMsg}</div>}
          <Button className="bg-blue-600 text-white" disabled>Change Password (stub)</Button>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow">
        <CardHeader>
          <CardTitle className="text-emerald-800">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-sm">Notification settings coming soon.</div>
        </CardContent>
      </Card>
    </div>
  );
} 