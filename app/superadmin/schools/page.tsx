"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { School, Plus, Search, Edit, Trash2, Users, GraduationCap, Calendar, LogIn, Copy, Power } from "lucide-react"
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
      if (Array.isArray(data)) {
        setSchools(data)
      } else {
        console.error("API did not return an array for schools:", data)
        setSchools([])
      }
    } catch (err) {
      console.error("Failed to load schools", err)
      setSchools([])
    }
  }

  const filteredSchools = schools.filter(
    (school) =>
      (school.name && school.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (school.schoolCode && school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleToggleSchoolStatus = async (school: any) => {
    try {
      const nextStatus = school.status === "active" ? "suspended" : "active"
      const res = await fetch(`/api/schools/${school.schoolCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update school status")
      toast({
        title: "School status updated",
        description: `${school.name} is now ${nextStatus}.`,
      })
      loadSchools()
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update school status.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSchool = async (school: any) => {
    const confirmed = window.confirm(
      `Delete ${school.name}? This removes the school and related records. This action cannot be undone.`
    )
    if (!confirmed) return
    try {
      const res = await fetch(`/api/schools/${school.schoolCode}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete school")
      toast({
        title: "School deleted",
        description: `${school.name} has been removed.`,
      })
      loadSchools()
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete school.",
        variant: "destructive",
      })
    }
  }

  if (!user || (user && (!user.isLoggedIn || user.role !== "super_admin"))) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <School className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{schools.length}</p>
                  <p className="text-sm text-stone-600">Total Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {schools.reduce((sum, school) => sum + (school.students?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-stone-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-amber-800" />
                <div>
                  <p className="text-2xl font-bold">
                    {schools.reduce((sum, school) => sum + (school.teachers?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-stone-600">Total Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{schools.filter((school) => school.status === "active").length}</p>
                  <p className="text-sm text-stone-600">Active Schools</p>
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
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-amber-600/50" />
                  <Input
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={loadSchools} variant="outline" className="border-amber-200 hover:bg-amber-50">
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSchools.length === 0 ? (
              <div className="py-8 text-center">
                <School className="mx-auto mb-4 h-12 w-12 text-amber-300" />
                <p className="text-stone-600">
                  {searchTerm ? "No schools found matching your search." : "No schools have been added yet."}
                </p>
                {!searchTerm && (
                  <Button
                    asChild
                    className="mt-4 border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700"
                  >
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
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{school.students?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            <span>{school.teachers?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={school.status === "active" ? "default" : "destructive"}
                            className={
                              school.status === "active"
                                ? "border-amber-200 bg-amber-100 text-amber-900"
                                : "border-orange-300 bg-orange-100 text-orange-950"
                            }
                          >
                            {school.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(school.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleAutofillLogin(school)}>
                              <LogIn className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => copyPortalUrl(school)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleSchoolStatus(school)}>
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" disabled>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSchool(school)}>
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
  )
}
