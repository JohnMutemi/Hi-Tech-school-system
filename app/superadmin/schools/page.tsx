"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { School, Plus, Search, Edit, Trash2, Users, GraduationCap, Calendar, LogIn, Copy, Power } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getPackageLabel, getSubscribedModuleChips, normalizePackageType, suggestPackageUpgrade } from "@/lib/school-package"
import { staffPortalLoginPath } from "@/lib/staff-portal-path"

export default function SchoolsManagementPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [schools, setSchools] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [updatingPackageFor, setUpdatingPackageFor] = useState<string | null>(null)

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
      const staffPath = staffPortalLoginPath(school.schoolCode, school.packageType)
      const res = await fetch(`/api/schools/${school.schoolCode}/admin-credentials`)
      if (res.ok) {
        const data = await res.json()
        const portalUrl = `${window.location.origin}${staffPath}?email=${encodeURIComponent(data.email)}&schoolName=${encodeURIComponent(school.name)}`
        window.open(portalUrl, "_blank")
        toast({
          title: "Login Page Opened",
          description: `Opened ${getPackageLabel(school.packageType)} login for ${school.name}.`,
        })
      } else {
        window.open(`${window.location.origin}${staffPath}`, "_blank")
        toast({
          title: "Portal Opened",
          description: `Opened staff login for ${school.name}`,
        })
      }
    } catch (error) {
      const staffPath = staffPortalLoginPath(school.schoolCode, school.packageType)
      window.open(`${window.location.origin}${staffPath}`, "_blank")
      toast({
        title: "Portal Opened",
        description: `School portal opened for ${school.name}`,
      })
    }
  }

  const copyPortalUrl = (school: any) => {
    const staffPath = staffPortalLoginPath(school.schoolCode, school.packageType)
    const portalUrl = `${window.location.origin}${staffPath}`
    navigator.clipboard.writeText(portalUrl)
    toast({
      title: "URL Copied",
      description: `Staff portal URL for ${school.name} copied to clipboard`,
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
      `Permanently delete "${school.name}" (code: ${school.schoolCode})?\n\n` +
        `This force-removes the school and ALL related data: students, staff accounts, fees, payments, grades, promotions, backups, and website content. ` +
        `You can recreate the same school code afterward for testing. This cannot be undone.`
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

  const handleQuickModuleUpgrade = async (
    school: any,
    addModule: "finance" | "grading"
  ) => {
    const nextPackage = suggestPackageUpgrade(school.packageType, addModule)
    if (nextPackage === normalizePackageType(school.packageType)) {
      toast({
        title: "Already subscribed",
        description: `${school.name} already has this module.`,
      })
      return
    }
    const label = addModule === "finance" ? "Finance" : "Academics & Grading"
    const confirmed = window.confirm(
      `Add the ${label} module to "${school.name}"?\n\n` +
        `Package will change from ${getPackageLabel(school.packageType)} to ${getPackageLabel(nextPackage)}. ` +
        `Staff will see a new workspace card on the staff login hub.\n\n` +
        `A first-time sign-in email with a temporary password will be sent to the school's registered email.`
    )
    if (!confirmed) return
    await handlePackageTypeChange(school, nextPackage)
  }

  const handlePackageTypeChange = async (school: any, packageType: string) => {
    try {
      setUpdatingPackageFor(school.id)
      const res = await fetch(`/api/schools/${school.schoolCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update package rights")

      const upgrade = data.packageUpgrade
      const addedModules = Array.isArray(upgrade?.addedModules) ? upgrade.addedModules : []
      const moduleNote =
        addedModules.length > 0
          ? ` New modules: ${addedModules.join(", ")}.`
          : ""

      if (upgrade?.upgraded) {
        toast({
          title: upgrade.emailSent ? "Package upgraded — email sent" : "Package upgraded — email failed",
          description: `${school.name} is now on ${getPackageLabel(packageType)}.${moduleNote} ${upgrade.message}`,
          variant: upgrade.emailSent ? "default" : "destructive",
        })
      } else {
        toast({
          title: "Package rights updated",
          description: `${school.name} is now on ${getPackageLabel(packageType)}.`,
        })
      }
      loadSchools()
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update package rights.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPackageFor(null)
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
                      <TableHead>Modules &amp; Upgrade</TableHead>
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
                        <TableCell>
                          <div className="space-y-2">
                            <Select
                              value={(school.packageType || "full").toLowerCase()}
                              onValueChange={(value) => handlePackageTypeChange(school, value)}
                              disabled={updatingPackageFor === school.id}
                            >
                              <SelectTrigger className="w-[190px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full Package</SelectItem>
                                <SelectItem value="finance_only">Finance Module</SelectItem>
                                <SelectItem value="grading_only">Academics &amp; Grading Module</SelectItem>
                                <SelectItem value="finance_grading">Finance + Academics Modules</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-1">
                              {getSubscribedModuleChips(school.packageType).map((chip) => (
                                <Badge
                                  key={chip}
                                  variant="outline"
                                  className="border-amber-200 bg-amber-50 text-[10px] text-amber-900"
                                >
                                  {chip}
                                </Badge>
                              ))}
                            </div>
                            {normalizePackageType(school.packageType) !== "full" ? (
                              <div className="flex flex-wrap gap-1">
                                {!getSubscribedModuleChips(school.packageType).includes("Finance") ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-emerald-200 px-2 text-[10px] text-emerald-800 hover:bg-emerald-50"
                                    disabled={updatingPackageFor === school.id}
                                    onClick={() => handleQuickModuleUpgrade(school, "finance")}
                                  >
                                    + Finance
                                  </Button>
                                ) : null}
                                {!getSubscribedModuleChips(school.packageType).includes("Academics") ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-blue-200 px-2 text-[10px] text-blue-800 hover:bg-blue-50"
                                    disabled={updatingPackageFor === school.id}
                                    onClick={() => handleQuickModuleUpgrade(school, "grading")}
                                  >
                                    + Academics
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
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
                            <Button variant="ghost" size="icon" asChild title="Edit school">
                              <Link href={`/superadmin/schools/${school.schoolCode}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
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
