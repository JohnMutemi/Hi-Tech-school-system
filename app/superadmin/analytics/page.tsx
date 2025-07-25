"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  School, 
  GraduationCap, 
  Calendar,
  ArrowLeft,
  BarChart3,
  Activity,
  Globe
} from "lucide-react"
import Link from "next/link"
import { getAllSchools } from "@/lib/school-storage"
import type { SchoolData } from "@/lib/school-storage"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
      if (typeof window !== 'undefined') {
        router.replace('/superadmin/login')
      }
    } else {
      loadAnalytics()
    }
    setIsLoading(false)
  }, [user, router])

  const loadAnalytics = () => {
    const allSchools = getAllSchools()
    setSchools(allSchools)
  }

  // Calculate analytics data
  const calculateAnalytics = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentSchools = schools.filter(school => new Date(school.createdAt) > thirtyDaysAgo)
    const previousPeriodSchools = schools.filter(
      school => new Date(school.createdAt) > sixtyDaysAgo && new Date(school.createdAt) <= thirtyDaysAgo
    )

    const totalStudents = schools.reduce((sum, school) => sum + (school.students?.length || 0), 0)
    const totalTeachers = schools.reduce((sum, school) => sum + (school.teachers?.length || 0), 0)
    const activeSchools = schools.filter(school => school.status === "active").length
    const setupSchools = schools.filter(school => school.status === "setup").length

    const growthRate = previousPeriodSchools.length > 0 
      ? ((recentSchools.length - previousPeriodSchools.length) / previousPeriodSchools.length) * 100
      : recentSchools.length > 0 ? 100 : 0

    return {
      totalSchools: schools.length,
      recentSchools: recentSchools.length,
      totalStudents,
      totalTeachers,
      activeSchools,
      setupSchools,
      growthRate,
      avgStudentsPerSchool: schools.length > 0 ? Math.round(totalStudents / schools.length) : 0,
      avgTeachersPerSchool: schools.length > 0 ? Math.round(totalTeachers / schools.length) : 0,
    }
  }

  const analytics = calculateAnalytics()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Schools</p>
                  <p className="text-2xl font-bold">{analytics.totalSchools}</p>
                </div>
                <School className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2">
                {analytics.growthRate >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold">{analytics.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  Avg: {analytics.avgStudentsPerSchool} per school
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-2xl font-bold">{analytics.totalTeachers}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  Avg: {analytics.avgTeachersPerSchool} per school
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Schools</p>
                  <p className="text-2xl font-bold">{analytics.recentSchools}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">Last 30 days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* School Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>School Status Distribution</span>
              </CardTitle>
              <CardDescription>Current status of all schools in the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active Schools</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{analytics.activeSchools}</span>
                    <span className="text-sm text-gray-500">
                      ({analytics.totalSchools > 0 ? Math.round((analytics.activeSchools / analytics.totalSchools) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Setup Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{analytics.setupSchools}</span>
                    <span className="text-sm text-gray-500">
                      ({analytics.totalSchools > 0 ? Math.round((analytics.setupSchools / analytics.totalSchools) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Suspended</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{analytics.totalSchools - analytics.activeSchools - analytics.setupSchools}</span>
                    <span className="text-sm text-gray-500">
                      ({analytics.totalSchools > 0 ? Math.round(((analytics.totalSchools - analytics.activeSchools - analytics.setupSchools) / analytics.totalSchools) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Platform Performance</span>
              </CardTitle>
              <CardDescription>Key performance indicators and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Platform Uptime</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    99.9%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Storage Used</span>
                  <span className="font-medium">~{Math.round((analytics.totalSchools * 2.5) * 10) / 10}MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <span className="font-medium">~120ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent School Activity</CardTitle>
            <CardDescription>Latest schools and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            {schools.length === 0 ? (
              <div className="text-center py-8">
                <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No schools have been added yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/superadmin/schools/add">
                    Add First School
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Teachers</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.slice(0, 10).map((school) => (
                      <TableRow key={school.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {school.logoUrl ? (
                              <img
                                src={school.logoUrl}
                                alt={`${school.name} logo`}
                                className="w-8 h-8 object-cover rounded-full border"
                                style={{ borderColor: school.colorTheme }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center border"
                                style={{
                                  backgroundColor: school.colorTheme + "20",
                                  borderColor: school.colorTheme,
                                }}
                              >
                                <School className="w-4 h-4" style={{ color: school.colorTheme }} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{school.name}</p>
                              <p className="text-sm text-gray-500">{school.schoolCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              school.status === "active"
                                ? "default"
                                : school.status === "setup"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {school.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{school.students?.length || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{school.teachers?.length || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(school.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(school.portalUrl, "_blank")}
                          >
                            View Portal
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 