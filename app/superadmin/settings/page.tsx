"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Settings,
  Shield,
  Bell,
  Database,
  Globe,
  Save,
  RefreshCw,
  Users,
  Palette,
  Mail,
  Lock,
  Server,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface SettingsData {
  platform: {
    name: string
    description: string
    logo: string
    favicon: string
    defaultTheme: string
    maintenanceMode: boolean
    maintenanceMessage: string
  }
  security: {
    requireTwoFactor: boolean
    sessionTimeout: number
    passwordPolicy: string
    maxLoginAttempts: number
    lockoutDuration: number
    apiRateLimit: number
  }
  notifications: {
    emailNotifications: boolean
    systemAlerts: boolean
    weeklyReports: boolean
    monthlyReports: boolean
    newSchoolAlerts: boolean
    emergencyNotifications: boolean
    adminEmail: string
  }
  system: {
    autoBackup: boolean
    backupFrequency: string
    dataRetention: number
    maxFileSize: number
    allowedFileTypes: string[]
    performanceMode: boolean
  }
  defaults: {
    defaultSchoolTheme: string
    defaultUserRole: string
    defaultPasswordPolicy: string
    defaultSessionTimeout: number
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [settings, setSettings] = useState<SettingsData>({
    platform: {
      name: "Hi-Tech SMS Platform",
      description: "Comprehensive School Management System",
      logo: "",
      favicon: "",
      defaultTheme: "#3b82f6",
      maintenanceMode: false,
      maintenanceMessage: "System is under maintenance. Please try again later."
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: 30,
      passwordPolicy: "strong",
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      apiRateLimit: 100
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
      weeklyReports: false,
      monthlyReports: true,
      newSchoolAlerts: true,
      emergencyNotifications: true,
      adminEmail: "admin@hitechsms.com"
    },
    system: {
      autoBackup: true,
      backupFrequency: "daily",
      dataRetention: 365,
      maxFileSize: 5,
      allowedFileTypes: ["jpg", "png", "pdf", "doc", "docx"],
      performanceMode: false
    },
    defaults: {
      defaultSchoolTheme: "#3b82f6",
      defaultUserRole: "admin",
      defaultPasswordPolicy: "strong",
      defaultSessionTimeout: 30
    }
  })

  useEffect(() => {
    if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
      if (typeof window !== 'undefined') {
        router.replace('/superadmin/login')
      }
    } else {
      setIsAuthenticated(true)
      loadSettings()
    }
    setIsLoading(false)
  }, [user, router])

  const loadSettings = () => {
    try {
    const savedSettings = localStorage.getItem("superadmin-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
    localStorage.setItem("superadmin-settings", JSON.stringify(settings))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        platform: {
          name: "Hi-Tech SMS Platform",
          description: "Comprehensive School Management System",
          logo: "",
          favicon: "",
          defaultTheme: "#3b82f6",
          maintenanceMode: false,
          maintenanceMessage: "System is under maintenance. Please try again later."
        },
        security: {
          requireTwoFactor: false,
          sessionTimeout: 30,
          passwordPolicy: "strong",
          maxLoginAttempts: 5,
          lockoutDuration: 15,
          apiRateLimit: 100
        },
        notifications: {
          emailNotifications: true,
          systemAlerts: true,
          weeklyReports: false,
          monthlyReports: true,
          newSchoolAlerts: true,
          emergencyNotifications: true,
          adminEmail: "admin@hitechsms.com"
        },
        system: {
          autoBackup: true,
          backupFrequency: "daily",
          dataRetention: 365,
          maxFileSize: 5,
          allowedFileTypes: ["jpg", "png", "pdf", "doc", "docx"],
          performanceMode: false
        },
        defaults: {
          defaultSchoolTheme: "#3b82f6",
          defaultUserRole: "admin",
          defaultPasswordPolicy: "strong",
          defaultSessionTimeout: 30
        }
      })
      
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to defaults.",
      })
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Manage platform configuration and preferences</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="platform" className="flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3" />
              <span className="hidden sm:inline">Platform</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 text-xs">
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 text-xs">
              <Bell className="h-3 w-3" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 text-xs">
              <Server className="h-3 w-3" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="defaults" className="flex items-center gap-2 text-xs">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Defaults</span>
            </TabsTrigger>
          </TabsList>

          {/* Platform Settings */}
          <TabsContent value="platform" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Platform Info */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
                    Platform Information
            </CardTitle>
                  <CardDescription>Configure basic platform details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                      value={settings.platform.name}
                      onChange={(e) => handleSettingChange('platform', 'name', e.target.value)}
                  placeholder="Enter platform name"
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="platformDescription">Description</Label>
                    <Textarea
                      id="platformDescription"
                      value={settings.platform.description}
                      onChange={(e) => handleSettingChange('platform', 'description', e.target.value)}
                      placeholder="Platform description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultTheme">Default Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.platform.defaultTheme}
                        onChange={(e) => handleSettingChange('platform', 'defaultTheme', e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                <Input
                        value={settings.platform.defaultTheme}
                        onChange={(e) => handleSettingChange('platform', 'defaultTheme', e.target.value)}
                        className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

              {/* Maintenance Mode */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Maintenance Mode
            </CardTitle>
                  <CardDescription>Control system availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                      <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Temporarily disable platform access</p>
                </div>
                <Switch
                      id="maintenanceMode"
                      checked={settings.platform.maintenanceMode}
                      onCheckedChange={(checked) => handleSettingChange('platform', 'maintenanceMode', checked)}
                />
              </div>
                  {settings.platform.maintenanceMode && (
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        id="maintenanceMessage"
                        value={settings.platform.maintenanceMessage}
                        onChange={(e) => handleSettingChange('platform', 'maintenanceMessage', e.target.value)}
                        placeholder="Message to display during maintenance"
                        rows={3}
                />
              </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Authentication */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Authentication
            </CardTitle>
                  <CardDescription>Configure security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Require 2FA for all users</p>
                </div>
                <Switch
                      id="twoFactor"
                  checked={settings.security.requireTwoFactor}
                      onCheckedChange={(checked) => handleSettingChange('security', 'requireTwoFactor', checked)}
                />
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordPolicy">Password Policy</Label>
                    <Select
                      value={settings.security.passwordPolicy}
                      onValueChange={(value) => handleSettingChange('security', 'passwordPolicy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weak">Weak (6+ characters)</SelectItem>
                        <SelectItem value="medium">Medium (8+ characters, mixed case)</SelectItem>
                        <SelectItem value="strong">Strong (10+ characters, symbols)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
                </CardContent>
              </Card>

              {/* Access Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                  <CardDescription>Manage login attempts and API limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>
                <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={settings.security.lockoutDuration}
                      onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                      min="5"
                      max="60"
                    />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/min)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={settings.security.apiRateLimit}
                      onChange={(e) => handleSettingChange('security', 'apiRateLimit', parseInt(e.target.value))}
                      min="10"
                      max="1000"
                    />
              </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>Configure email alert preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={settings.notifications.adminEmail}
                      onChange={(e) => handleSettingChange('notifications', 'adminEmail', e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="newSchoolAlerts">New School Alerts</Label>
                      <p className="text-sm text-gray-500">Notify when new schools register</p>
                    </div>
                    <Switch
                      id="newSchoolAlerts"
                      checked={settings.notifications.newSchoolAlerts}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'newSchoolAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emergencyNotifications">Emergency Notifications</Label>
                      <p className="text-sm text-gray-500">Critical system alerts</p>
                    </div>
                    <Switch
                      id="emergencyNotifications"
                      checked={settings.notifications.emergencyNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'emergencyNotifications', checked)}
                    />
            </div>
          </CardContent>
        </Card>

              {/* Report Settings */}
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Reports & Alerts
            </CardTitle>
                  <CardDescription>Configure automated reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemAlerts">System Alerts</Label>
                      <p className="text-sm text-gray-500">Platform performance alerts</p>
                    </div>
                    <Switch
                      id="systemAlerts"
                      checked={settings.notifications.systemAlerts}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'systemAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-sm text-gray-500">Send weekly summary reports</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={settings.notifications.weeklyReports}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'weeklyReports', checked)}
                    />
                  </div>
              <div className="flex items-center justify-between">
                <div>
                      <Label htmlFor="monthlyReports">Monthly Reports</Label>
                      <p className="text-sm text-gray-500">Send monthly detailed reports</p>
                </div>
                <Switch
                      id="monthlyReports"
                      checked={settings.notifications.monthlyReports}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'monthlyReports', checked)}
                />
              </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backup & Storage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Backup & Storage
                  </CardTitle>
                  <CardDescription>Configure data backup and retention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                      <Label htmlFor="autoBackup">Auto Backup</Label>
                      <p className="text-sm text-gray-500">Automatically backup data</p>
                </div>
                <Switch
                      id="autoBackup"
                      checked={settings.system.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange('system', 'autoBackup', checked)}
                />
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={settings.system.backupFrequency}
                      onValueChange={(value) => handleSettingChange('system', 'backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  value={settings.system.dataRetention}
                      onChange={(e) => handleSettingChange('system', 'dataRetention', parseInt(e.target.value))}
                  min="30"
                  max="3650"
                />
            </div>
          </CardContent>
        </Card>

              {/* File Management */}
        <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    File Management
                  </CardTitle>
                  <CardDescription>Configure file upload settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={settings.system.maxFileSize}
                      onChange={(e) => handleSettingChange('system', 'maxFileSize', parseInt(e.target.value))}
                      min="1"
                      max="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                    <Input
                      id="allowedFileTypes"
                      value={settings.system.allowedFileTypes.join(', ')}
                      onChange={(e) => handleSettingChange('system', 'allowedFileTypes', e.target.value.split(', ').map(s => s.trim()))}
                      placeholder="jpg, png, pdf, doc, docx"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="performanceMode">Performance Mode</Label>
                      <p className="text-sm text-gray-500">Optimize for speed over features</p>
                    </div>
                    <Switch
                      id="performanceMode"
                      checked={settings.system.performanceMode}
                      onCheckedChange={(checked) => handleSettingChange('system', 'performanceMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Default Settings */}
          <TabsContent value="defaults" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* School Defaults */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    School Defaults
                  </CardTitle>
                  <CardDescription>Default settings for new schools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultSchoolTheme">Default School Theme</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.defaults.defaultSchoolTheme}
                        onChange={(e) => handleSettingChange('defaults', 'defaultSchoolTheme', e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.defaults.defaultSchoolTheme}
                        onChange={(e) => handleSettingChange('defaults', 'defaultSchoolTheme', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultUserRole">Default User Role</Label>
                    <Select
                      value={settings.defaults.defaultUserRole}
                      onValueChange={(value) => handleSettingChange('defaults', 'defaultUserRole', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* User Defaults */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    User Defaults
                  </CardTitle>
                  <CardDescription>Default security settings for users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultPasswordPolicy">Default Password Policy</Label>
                    <Select
                      value={settings.defaults.defaultPasswordPolicy}
                      onValueChange={(value) => handleSettingChange('defaults', 'defaultPasswordPolicy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weak">Weak</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultSessionTimeout">Default Session Timeout (minutes)</Label>
                    <Input
                      id="defaultSessionTimeout"
                      type="number"
                      value={settings.defaults.defaultSessionTimeout}
                      onChange={(e) => handleSettingChange('defaults', 'defaultSessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
            </div>
          </CardContent>
        </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 