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
      setIsAuthenticated(true)
      loadAnalytics()
    }
  }, [user, router])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const allSchools = await getAllSchools()
      setSchools(allSchools || [])
    } catch (error) {
      console.error("Error loading schools:", error)
      setSchools([])
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate analytics data
  const calculateAnalytics = () => {
    // Ensure schools is an array
    if (!Array.isArray(schools)) {
      return {
        totalSchools: 0,
        recentSchools: 0,
        totalStudents: 0,
        totalTeachers: 0,
        activeSchools: 0,
        setupSchools: 0,
        growthRate: 0,
        avgStudentsPerSchool: 0,
        avgTeachersPerSchool: 0,
      }
    }

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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl">
        {/* Header with Navigation and Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 border-amber-200 hover:bg-amber-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">System Analytics</h1>
              <p className="text-stone-600">Comprehensive overview of platform performance and school statistics</p>
            </div>
          </div>
          <Button 
            onClick={loadAnalytics} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2 border-amber-200 text-amber-900 hover:bg-amber-50"
          >
            <div className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-amber-200 border-t-amber-600" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-600 md:text-sm">Total Schools</p>
                  <p className="text-xl font-bold md:text-2xl">{analytics.totalSchools}</p>
                </div>
                <School className="h-6 w-6 text-amber-600 md:h-8 md:w-8" />
              </div>
              <div className="mt-2 flex items-center">
                {analytics.growthRate >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-amber-600 md:h-4 md:w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-orange-700 md:h-4 md:w-4" />
                )}
                <span
                  className={`text-xs md:text-sm ${analytics.growthRate >= 0 ? "text-amber-700" : "text-orange-800"}`}
                >
                  {analytics.growthRate >= 0 ? "+" : ""}
                  {analytics.growthRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-600 md:text-sm">Total Students</p>
                  <p className="text-xl font-bold md:text-2xl">{analytics.totalStudents}</p>
                </div>
                <Users className="h-6 w-6 text-orange-600 md:h-8 md:w-8" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-stone-600 md:text-sm">
                  Avg: {analytics.avgStudentsPerSchool} per school
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-600 md:text-sm">Total Teachers</p>
                  <p className="text-xl font-bold md:text-2xl">{analytics.totalTeachers}</p>
                </div>
                <GraduationCap className="h-6 w-6 text-amber-800 md:h-8 md:w-8" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-stone-600 md:text-sm">
                  Avg: {analytics.avgTeachersPerSchool} per school
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-600 md:text-sm">New Schools</p>
                  <p className="text-xl font-bold md:text-2xl">{analytics.recentSchools}</p>
                </div>
                <Calendar className="h-6 w-6 text-yellow-600 md:h-8 md:w-8" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-stone-600 md:text-sm">Last 30 days</span>
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
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
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
                    <div className="h-3 w-3 rounded-full bg-orange-400" />
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
                    <div className="h-3 w-3 rounded-full bg-orange-900/80" />
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
                  <Badge variant="default" className="border-amber-200 bg-amber-100 text-amber-900">
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
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                <p className="text-stone-600">Loading schools…</p>
              </div>
            ) : !Array.isArray(schools) || schools.length === 0 ? (
              <div className="py-8 text-center">
                <School className="mx-auto mb-4 h-12 w-12 text-amber-300" />
                <p className="text-stone-600">No schools have been added yet.</p>
                <Button
                  asChild
                  className="mt-4 border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700"
                >
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
                            className="border-amber-200 hover:bg-amber-50"
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