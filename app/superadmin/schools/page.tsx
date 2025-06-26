"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { School, Plus, Search, Eye, Edit, Trash2, Users, GraduationCap, Calendar, LogIn, Copy } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function SchoolsManagementPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [schools, setSchools] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
      if (typeof window !== 'undefined') {
        router.replace('/superadmin/login')
      }
    } else {
      loadSchools()
    }
  }, [user, router])

  const loadSchools = async () => {
    try {
      const res = await fetch("/api/schools")
      const data = await res.json()
      setSchools(data)
    } catch (err) {
      setSchools([])
    }
  }

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAutofillLogin = async (school: any) => {
    try {
      // Get admin credentials for this school
      const res = await fetch(`/api/schools/${school.schoolCode}/admin-credentials`)
      if (res.ok) {
        const data = await res.json()
        // Open the school portal with just the email autofilled
        const portalUrl = `${window.location.origin}/schools/${school.schoolCode}?email=${encodeURIComponent(data.email)}&schoolName=${encodeURIComponent(school.name)}`
        window.open(portalUrl, "_blank")
        toast({
          title: "Login Page Opened",
          description: `School login page opened with autofilled email for ${school.name}. Please enter your password.`,
        })
      } else {
        // Fallback: open portal without autofill
        window.open(school.portalUrl, "_blank")
        toast({
          title: "Portal Opened",
          description: `School portal opened for ${school.name}`,
        })
      }
    } catch (error) {
      // Fallback: open portal without autofill
      window.open(school.portalUrl, "_blank")
      toast({
        title: "Portal Opened",
        description: `School portal opened for ${school.name}`,
      })
    }
  }

  const copyPortalUrl = (school: any) => {
    const portalUrl = `${window.location.origin}${school.portalUrl}`
    navigator.clipboard.writeText(portalUrl)
    toast({
      title: "URL Copied",
      description: `Portal URL for ${school.name} copied to clipboard`,
    })
  }

  if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <School className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{schools.length}</p>
                  <p className="text-sm text-gray-600">Total Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {schools.reduce((sum, school) => sum + (school.students?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {schools.reduce((sum, school) => sum + (school.teachers?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{schools.filter((school) => school.status === "active").length}</p>
                  <p className="text-sm text-gray-600">Active Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Schools ({schools.length})</CardTitle>
                <CardDescription>Manage and monitor all schools in the system</CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={loadSchools} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSchools.length === 0 ? (
              <div className="text-center py-8">
                <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? "No schools found matching your search." : "No schools have been added yet."}
                </p>
                {!searchTerm && (
                  <Button asChild className="mt-4">
                    <Link href="/superadmin/schools/add">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First School
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Teachers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {school.logoUrl ? (
                              <img
                                src={school.logoUrl || "/placeholder.svg"}
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
                              <p className="text-sm text-gray-500">{school.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{school.schoolCode}</span>
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
                          <span className="font-medium">{school.students?.length || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{school.teachers?.length || 0}</span>
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
                              onClick={() => handleAutofillLogin(school)}
                              title="Login with autofilled credentials"
                            >
                              <LogIn className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(school.portalUrl, "_blank")}
                              title="View school portal"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyPortalUrl(school)}
                              title="Copy portal URL"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600" disabled>
                              <Trash2 className="w-4 h-4" />
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
    </div>
  )
}
