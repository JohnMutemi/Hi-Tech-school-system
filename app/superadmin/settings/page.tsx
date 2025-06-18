"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Settings,
  Shield,
  Bell,
  Database,
  Globe,
  Save,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    platformName: "eduSMS Platform",
    adminEmail: "admin@edusms.com",
    notifications: {
      newSchoolAlert: true,
      systemAlerts: true,
      weeklyReports: false,
      emailNotifications: true
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: 30,
      passwordPolicy: "strong"
    },
    system: {
      autoBackup: true,
      dataRetention: 365,
      maintenanceMode: false
    }
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/superadmin/check-auth');
      if (response.ok) {
        setIsAuthenticated(true);
        loadSettings();
      } else {
        window.location.href = "/superadmin/login";
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/superadmin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        // You could add a toast notification here
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  }

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/superadmin" className="text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-2">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                  <p className="text-sm text-gray-600">Configure platform preferences and system options</p>
                </div>
              </div>
            </div>
            <Button onClick={saveSettings} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* General Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                  placeholder="Enter platform name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New School Alerts</p>
                  <p className="text-sm text-gray-600">Get notified when new schools are added</p>
                </div>
                <Switch
                  checked={settings.notifications.newSchoolAlert}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "newSchoolAlert", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Alerts</p>
                  <p className="text-sm text-gray-600">Receive system maintenance and error notifications</p>
                </div>
                <Switch
                  checked={settings.notifications.systemAlerts}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "systemAlerts", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-gray-600">Receive weekly platform usage reports</p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "weeklyReports", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Send notifications via email</p>
                </div>
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "emailNotifications", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>Configure security and authentication options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
                </div>
                <Switch
                  checked={settings.security.requireTwoFactor}
                  onCheckedChange={(checked) => handleSettingChange("security", "requireTwoFactor", checked)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange("security", "sessionTimeout", parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <select
                    id="passwordPolicy"
                    value={settings.security.passwordPolicy}
                    onChange={(e) => handleSettingChange("security", "passwordPolicy", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic (6+ characters)</option>
                    <option value="medium">Medium (8+ characters, mixed case)</option>
                    <option value="strong">Strong (10+ characters, symbols, numbers)</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>System Settings</span>
            </CardTitle>
            <CardDescription>Configure system behavior and data management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Backup</p>
                  <p className="text-sm text-gray-600">Automatically backup school data daily</p>
                </div>
                <Switch
                  checked={settings.system.autoBackup}
                  onCheckedChange={(checked) => handleSettingChange("system", "autoBackup", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Temporarily disable platform access</p>
                </div>
                <Switch
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange("system", "maintenanceMode", checked)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  value={settings.system.dataRetention}
                  onChange={(e) => handleSettingChange("system", "dataRetention", parseInt(e.target.value))}
                  min="30"
                  max="3650"
                />
                <p className="text-sm text-gray-600">How long to keep inactive school data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Actions */}
        <Card>
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
            <CardDescription>Perform system-wide operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Cache
              </Button>
              <Button variant="outline" className="justify-start">
                <Database className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Security Audit
              </Button>
              <Button variant="outline" className="justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Test Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 