"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  School, 
  GraduationCap, 
  Calendar,
  Activity,
  Globe,
  Shield,
  Database,
  Bell,
  Plus,
  ArrowRight,
  Star,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react"
import Link from "next/link"
import { getAllSchools } from "@/lib/school-storage"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalSchools: number
  activeSchools: number
  totalStudents: number
  totalTeachers: number
  recentGrowth: number
  systemHealth: number
  storageUsed: number
  uptime: number
}

interface RecentActivity {
  id: string
  type: 'school_added' | 'user_login' | 'system_alert' | 'backup_completed'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    recentGrowth: 0,
    systemHealth: 0,
    storageUsed: 0,
    uptime: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
      router.replace('/superadmin/login')
      return
    }

    loadDashboardData()
  }, [user, router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load schools data
      const schools = await getAllSchools()
      const totalSchools = schools?.length || 0
      const activeSchools = schools?.filter(s => s.status === 'active').length || 0
      
      // Calculate other stats
      const totalStudents = schools?.reduce((sum, school) => sum + (school.students?.length || 0), 0) || 0
      const totalTeachers = schools?.reduce((sum, school) => sum + (school.teachers?.length || 0), 0) || 0
      
      setStats({
        totalSchools,
        activeSchools,
        totalStudents,
        totalTeachers,
        recentGrowth: 12.5, // Mock data
        systemHealth: 98.5,
        storageUsed: 65.2,
        uptime: 99.9
      })

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'school_added',
          title: 'New School Registered',
          description: 'St. Mary\'s Academy has been added to the platform',
          timestamp: '2 minutes ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'system_alert',
          title: 'System Backup Completed',
          description: 'Daily backup completed successfully',
          timestamp: '1 hour ago',
          status: 'success'
        },
        {
          id: '3',
          type: 'user_login',
          title: 'Admin Login',
          description: 'School admin logged in from 192.168.1.100',
          timestamp: '3 hours ago',
          status: 'info'
        },
        {
          id: '4',
          type: 'system_alert',
          title: 'High Storage Usage',
          description: 'Storage usage is at 85% capacity',
          timestamp: '5 hours ago',
          status: 'warning'
        }
      ])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'school_added': return <School className="w-4 h-4" />
      case 'user_login': return <Users className="w-4 h-4" />
      case 'system_alert': return <Bell className="w-4 h-4" />
      case 'backup_completed': return <Database className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-slate-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in relative">
      {/* Sticky Welcome Section - Reduced Size */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-red-600 via-red-700 to-red-800 backdrop-blur-md border-b border-red-500/30 shadow-lg mb-8">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white truncate">
                    Welcome back, Platform Super Admin! 👋
                  </h1>
                  <p className="text-red-100 text-xs lg:text-sm mt-1 line-clamp-1">
                    Here's what's happening with your platform today. All systems are operational.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs px-2 py-1 whitespace-nowrap">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    System Healthy
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs px-2 py-1 whitespace-nowrap">
                    <Clock className="w-3 h-3 mr-1" />
                    {stats.uptime}% Uptime
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs px-3 py-1.5">
                <Bell className="w-3 h-3 mr-1" />
                Notifications
              </Button>
              <Button asChild size="sm" className="bg-white text-red-600 hover:bg-gray-100 text-xs px-3 py-1.5">
                <Link href="/superadmin/schools/add">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-4 lg:px-6">

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-gray-600">Total Schools</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalSchools}</p>
                <div className="flex items-center mt-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-base text-green-600">+{stats.recentGrowth}%</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-red-500/20">
                <School className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-gray-600">Active Schools</p>
                <p className="text-4xl font-bold text-gray-900">{stats.activeSchools}</p>
                <div className="flex items-center mt-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-base text-green-600">Active</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-slate-500/20">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-300">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-gray-600">Total Students</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                <div className="flex items-center mt-3">
                  <Users className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-base text-blue-600">Enrolled</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-blue-500/20">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-400">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-gray-600">Total Teachers</p>
                <p className="text-4xl font-bold text-gray-900">{stats.totalTeachers.toLocaleString()}</p>
                <div className="flex items-center mt-3">
                  <GraduationCap className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-base text-orange-600">Staff</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-orange-500/20">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* System Health */}
        <Card className="animate-slide-up animate-delay-500">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="w-6 h-6 text-green-600" />
              System Health
            </CardTitle>
            <CardDescription className="text-base">Current system performance and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Overall Health</span>
                <span className="text-base font-bold text-green-600">{stats.systemHealth}%</span>
              </div>
              <Progress value={stats.systemHealth} className="h-4" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Storage Usage</span>
                <span className="text-base font-bold text-blue-600">{stats.storageUsed}%</span>
              </div>
              <Progress value={stats.storageUsed} className="h-4" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Uptime</span>
                <span className="text-base font-bold text-green-600">{stats.uptime}%</span>
              </div>
              <Progress value={stats.uptime} className="h-4" />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6">
              <div className="text-center p-6 bg-green-50 rounded-2xl">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="text-base font-medium text-green-700">All Systems</p>
                <p className="text-sm text-green-600">Operational</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <Database className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="text-base font-medium text-blue-700">Database</p>
                <p className="text-sm text-blue-600">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="animate-slide-up animate-delay-600">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Activity className="w-6 h-6 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-base">Latest system events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 hover:shadow-md animate-slide-up animate-delay-${(index + 1) * 100}`}
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-base">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button variant="outline" className="w-full h-12 text-base" asChild>
                <Link href="/superadmin/analytics">
                  View All Activity
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-slide-up animate-delay-700">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Star className="w-6 h-6 text-yellow-600" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-base">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button asChild className="h-24 flex-col gap-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-base shadow-lg border border-red-500/20">
              <Link href="/superadmin/schools/add">
                <Plus className="w-8 h-8" />
                Add School
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-3 text-base">
              <Link href="/superadmin/analytics">
                <TrendingUp className="w-8 h-8" />
                View Analytics
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-3 text-base">
              <Link href="/superadmin/settings">
                <Settings className="w-8 h-8" />
                System Settings
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-3 text-base">
              <Link href="/superadmin/schools">
                <School className="w-8 h-8" />
                Manage Schools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-delay-100 { animation-delay: 100ms; }
        .animate-delay-200 { animation-delay: 200ms; }
        .animate-delay-300 { animation-delay: 300ms; }
        .animate-delay-400 { animation-delay: 400ms; }
        .animate-delay-500 { animation-delay: 500ms; }
        .animate-delay-600 { animation-delay: 600ms; }
        .animate-delay-700 { animation-delay: 700ms; }
      `}</style>
    </div>
  )
}
