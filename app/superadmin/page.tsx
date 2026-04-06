"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  School, 
  GraduationCap, 
  Calendar,
  Activity,
  Shield,
  Database,
  Bell,
  Plus,
  ArrowRight,
  Star,
  CheckCircle,
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
      case 'success':
        return 'text-amber-900 bg-amber-50 border-amber-200'
      case 'warning':
        return 'text-orange-900 bg-orange-50 border-orange-200'
      case 'error':
        return 'text-orange-950 bg-orange-100 border-orange-300'
      case 'info':
        return 'text-amber-800 bg-amber-100/80 border-amber-200'
      default:
        return 'text-stone-700 bg-stone-50 border-stone-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in relative space-y-8">
      <div className="space-y-8 px-4 lg:px-6">

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-stone-600">Total Schools</p>
                <p className="text-4xl font-bold text-stone-900">{stats.totalSchools}</p>
                <div className="flex items-center mt-3">
                  <TrendingUp className="w-5 h-5 text-amber-600 mr-2" />
                  <span className="text-base text-amber-700">+{stats.recentGrowth}%</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-amber-400/30">
                <School className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-stone-600">Active Schools</p>
                <p className="text-4xl font-bold text-stone-900">{stats.activeSchools}</p>
                <div className="flex items-center mt-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 mr-2" />
                  <span className="text-base text-amber-700">Active</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-amber-500/25">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-300">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-stone-600">Total Students</p>
                <p className="text-4xl font-bold text-stone-900">{stats.totalStudents.toLocaleString()}</p>
                <div className="flex items-center mt-3">
                  <Users className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="text-base text-orange-700">Enrolled</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-orange-400/30">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animate-delay-400">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-stone-600">Total Teachers</p>
                <p className="text-4xl font-bold text-stone-900">{stats.totalTeachers.toLocaleString()}</p>
                <div className="flex items-center mt-3">
                  <GraduationCap className="w-5 h-5 text-amber-700 mr-2" />
                  <span className="text-base text-amber-800">Staff</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg border border-yellow-400/30">
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
              <Shield className="w-6 h-6 text-amber-600" />
              System Health
            </CardTitle>
            <CardDescription className="text-base">Current system performance and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Overall Health</span>
                <span className="text-base font-bold text-amber-700">{stats.systemHealth}%</span>
              </div>
              <Progress value={stats.systemHealth} className="h-4 [&>div]:!bg-amber-600" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Storage Usage</span>
                <span className="text-base font-bold text-orange-700">{stats.storageUsed}%</span>
              </div>
              <Progress value={stats.storageUsed} className="h-4 [&>div]:!bg-orange-500" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Uptime</span>
                <span className="text-base font-bold text-amber-700">{stats.uptime}%</span>
              </div>
              <Progress value={stats.uptime} className="h-4 [&>div]:!bg-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6">
              <div className="text-center rounded-2xl border border-amber-200/60 bg-amber-50 p-6">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-amber-600" />
                <p className="text-base font-medium text-amber-900">All Systems</p>
                <p className="text-sm text-amber-700">Operational</p>
              </div>
              <div className="text-center rounded-2xl border border-orange-200/60 bg-orange-50/80 p-6">
                <Database className="mx-auto mb-3 h-10 w-10 text-orange-600" />
                <p className="text-base font-medium text-orange-900">Database</p>
                <p className="text-sm text-orange-800">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="animate-slide-up animate-delay-600">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Activity className="w-6 h-6 text-amber-600" />
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
                    <p className="text-base font-medium text-stone-900">{activity.title}</p>
                    <p className="mt-1 text-sm text-stone-600">{activity.description}</p>
                    <p className="mt-2 text-xs text-stone-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button variant="outline" className="h-12 w-full border-amber-200 text-base text-amber-900 hover:bg-amber-50" asChild>
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
            <Star className="h-6 w-6 text-amber-600" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-base">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button asChild className="h-24 flex-col gap-3 border border-amber-400/30 bg-gradient-to-br from-amber-600 to-orange-600 text-base text-white shadow-lg hover:from-amber-700 hover:to-orange-700">
              <Link href="/superadmin/schools/add">
                <Plus className="w-8 h-8" />
                Add School
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-3 border-amber-200 text-base text-amber-900 hover:bg-amber-50">
              <Link href="/superadmin/analytics">
                <TrendingUp className="w-8 h-8" />
                View Analytics
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-3 border-amber-200 text-base text-amber-900 hover:bg-amber-50">
              <Link href="/superadmin/settings">
                <Settings className="w-8 h-8" />
                System Settings
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-24 flex-col gap-3 border-amber-200 text-base text-amber-900 hover:bg-amber-50">
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
