"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  School, 
  Plus, 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  Activity,
  Globe,
  Settings,
  LogOut,
  Eye,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { getAllSchools } from "@/lib/school-storage"
import type { SchoolData } from "@/lib/school-storage"

export function SuperAdminDashboard() {
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    recentSchools: 0,
    platformHealth: "excellent"
  })

  useEffect(() => {
    (async () => {
      await loadDashboardData();
    })();
  }, []);

  const loadDashboardData = async () => {
    const allSchools = await getAllSchools();
    setSchools(allSchools);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setStats({
      totalSchools: allSchools.length,
      activeSchools: allSchools.filter(school => school.status === "active").length,
      totalStudents: allSchools.reduce((sum, school) => sum + (school.students?.length || 0), 0),
      totalTeachers: allSchools.reduce((sum, school) => sum + (school.teachers?.length || 0), 0),
      recentSchools: allSchools.filter(school => new Date(school.createdAt) > thirtyDaysAgo).length,
      platformHealth: allSchools.length > 0 ? "excellent" : "good"
    });
  };

  const recentSchools = schools
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-2">Welcome back, Super Admin!</h2>
        <p className="text-gray-600">Manage your educational platform and monitor all schools in the system.</p>
      </div>
      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/superadmin/schools/add">
              <Plus className="w-4 h-4 mr-2" />
              Add New School
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/superadmin/schools">
              <School className="w-4 h-4 mr-2" />
              Manage Schools
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/superadmin/analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <School className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSchools}</p>
                <p className="text-sm text-gray-600">Total Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                <p className="text-sm text-gray-600">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.recentSchools}</p>
                <p className="text-sm text-gray-600">New This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Platform Health</span>
            </CardTitle>
            <CardDescription>Current system status and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Status</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {stats.platformHealth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Schools</span>
                <span className="font-medium">{stats.activeSchools}/{stats.totalSchools}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Usage</span>
                <span className="font-medium">~{Math.round((stats.totalSchools * 2.5) * 10) / 10}MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-medium">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Quick Stats</span>
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Students per School</span>
                <span className="font-medium">
                  {stats.totalSchools > 0 ? Math.round(stats.totalStudents / stats.totalSchools) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Teachers per School</span>
                <span className="font-medium">
                  {stats.totalSchools > 0 ? Math.round(stats.totalTeachers / stats.totalSchools) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth Rate (30 days)</span>
                <span className="font-medium text-green-600">
                  +{stats.recentSchools} schools
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Uptime</span>
                <span className="font-medium text-green-600">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Schools */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recently Added Schools</CardTitle>
              <CardDescription>Latest schools that have joined the platform</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/superadmin/schools">
                View All Schools
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentSchools.length === 0 ? (
            <div className="text-center py-8">
              <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No schools have been added yet.</p>
              <Button asChild className="mt-4">
                <Link href="/superadmin/schools/add">
                  <Plus className="w-4 h-4 mr-2" />
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
                    <TableHead>Code</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSchools.map((school) => (
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
                            <p className="text-sm text-gray-500">{school.profile?.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {school.schoolCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {school.adminFirstName} {school.adminLastName}
                          </p>
                          <p className="text-xs text-gray-500">{school.adminEmail}</p>
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
                        <span className="text-sm text-gray-600">
                          {new Date(school.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(school.portalUrl, "_blank")}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}${school.portalUrl}`
                              navigator.clipboard.writeText(url)
                              // You could add a toast notification here
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
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
  )
} 