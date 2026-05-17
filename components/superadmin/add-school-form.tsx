"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  School,
  Upload,
  Building2,
  Contact,
  Settings,
  Image,
} from "lucide-react"
import { saveSchool, getSchool, getAllSchools } from "@/lib/school-storage"
import { generateSchoolCode, generateTempPassword } from "@/lib/utils/school-generator"
import { SchoolCreationSuccess } from "./school-creation-success"
import { createSchoolClient } from "@/lib/actions/school-actions"
import { ColorPalettePicker } from "./color-palette-picker"
import { isAcceptableSchoolLogoFile, SCHOOL_LOGO_ACCEPT } from "@/lib/utils/school-logo-file"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AddSchoolFormProps {
  onSchoolAdded?: () => void
}

const AddSchoolForm: React.FC<AddSchoolFormProps> = ({ onSchoolAdded }) => {
  const { toast } = useToast()
  const router = useRouter()
  const [schoolData, setSchoolData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    code: "",
    colorTheme: "#d97706",
    description: "",
    website: "",
    principalName: "",
    establishedYear: new Date().getFullYear().toString(),
    motto: "",
    packageType: "full",
    colorPaletteSlug: "amber",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({
    schoolCode: "",
    tempPassword: "",
    portalUrl: "",
    schoolName: "",
    adminEmail: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSchoolData({ ...schoolData, [name]: value })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Logo file size must be less than 5MB")
        return
      }
      
      if (!isAcceptableSchoolLogoFile(file)) {
        setError("Please select a PNG, JPG, GIF, or WebP image")
        return
      }

      setLogoFile(file)
      setError("")
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolData({ ...schoolData, colorTheme: e.target.value })
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const {
        name,
        address,
        phone,
        email,
        code,
        colorTheme,
        description,
        website,
        principalName,
        establishedYear,
        motto,
        packageType,
        colorPaletteSlug,
      } = schoolData

      // Validate required fields
      if (!name || !address || !phone || !email) {
        setError("All required fields must be filled")
        setIsSubmitting(false)
        return
      }

      let logoUrl = ""
      if (logoFile) {
        try {
          logoUrl = await readFileAsDataUrl(logoFile)
        } catch (error) {
          console.error("Error processing logo:", error)
          setError("Could not read the logo file. Try a smaller image or a different format.")
          setIsSubmitting(false)
          return
        }
      }

      const result = await createSchoolClient({
        name,
        address,
        phone,
        email,
        code,
        colorTheme,
        description,
        website,
        principalName,
        establishedYear,
        motto,
        logoUrl,
        packageType,
        colorPaletteSlug,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        if ("warnings" in result && Array.isArray(result.warnings) && result.warnings.length > 0) {
          result.warnings.forEach((w) =>
            toast({
              title: "Notice",
              description: w,
              duration: 10_000,
            })
          )
        }
        // Show success modal
        setSuccessData({
          schoolCode: result.schoolCode,
          tempPassword: result.tempPassword,
          portalUrl: result.portalUrl,
          schoolName: name,
          adminEmail: email
        })
        setShowSuccessModal(true)
        onSchoolAdded?.()
        
        // Reset form
        setSchoolData({
          name: "",
          address: "",
          phone: "",
          email: "",
          code: "",
          colorTheme: "#d97706",
          description: "",
          website: "",
          principalName: "",
          establishedYear: new Date().getFullYear().toString(),
          motto: "",
          packageType: "full",
          colorPaletteSlug: "amber",
        })
        setLogoFile(null)
        setLogoPreview("")
      }

    } catch (error) {
      console.error("Error creating school:", error)
      setError("Failed to create school. Please try again.")
    }

    setIsSubmitting(false)
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    router.push('/superadmin/schools')
  }

  return (
    <>
      <Card className="mx-auto w-full max-w-4xl rounded-xl border border-amber-200/60 bg-card shadow-lg">
        <CardHeader className="px-4 pb-3 md:px-6">
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <School className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg font-bold text-stone-900 sm:text-xl">
            Add New School
          </CardTitle>
              <CardDescription className="text-xs text-stone-600 sm:text-sm">
                Register a new school to the platform
          </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-3 grid h-10 w-full grid-cols-4 bg-amber-100/50 p-1 md:mb-4 md:h-9">
                <TabsTrigger
                  value="basic"
                  className="flex items-center justify-center gap-1 px-2 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white md:gap-2 md:px-3"
                >
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Basic</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="flex items-center justify-center gap-1 px-2 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white md:gap-2 md:px-3"
                >
                  <Contact className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Contact</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center justify-center gap-1 px-2 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white md:gap-2 md:px-3"
                >
                  <Settings className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="branding"
                  className="flex items-center justify-center gap-1 px-2 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white md:gap-2 md:px-3"
                >
                  <Image className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Branding</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium text-stone-700 md:text-sm">
                      School Name *
                    </Label>
              <Input
                id="name"
                name="name"
                value={schoolData.name}
                onChange={handleChange}
                      className="h-9 md:h-10 text-sm"
                required
              />
            </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="code" className="text-xs md:text-sm font-medium text-stone-700">
                      School Code
                    </Label>
              <Input
                id="code"
                name="code"
                value={schoolData.code}
                onChange={handleChange}
                      className="h-9 md:h-10 text-sm"
                      placeholder="Auto-generated if empty"
              />
            </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="packageType" className="text-xs md:text-sm font-medium text-stone-700">
                    Package Rights
                  </Label>
                  <Select
                    value={schoolData.packageType}
                    onValueChange={(value) => setSchoolData({ ...schoolData, packageType: value })}
                  >
                    <SelectTrigger id="packageType" className="h-9 md:h-10 text-sm">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Package</SelectItem>
                      <SelectItem value="finance_only">Finance Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="description" className="text-xs md:text-sm font-medium text-stone-700">
                    Description
                  </Label>
              <Textarea
                id="description"
                name="description"
                value={schoolData.description}
                onChange={handleChange}
                    className="text-sm resize-none"
                    rows={2}
                    placeholder="Brief description of the school"
              />
            </div>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="email" className="text-xs md:text-sm font-medium text-stone-700">
                      Admin Email *
                    </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={schoolData.email}
                onChange={handleChange}
                      className="h-9 md:h-10 text-sm"
                required
              />
            </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="phone" className="text-xs md:text-sm font-medium text-stone-700">
                      Phone Number *
                    </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={schoolData.phone}
                onChange={handleChange}
                      className="h-9 md:h-10 text-sm"
                required
              />
            </div>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="address" className="text-xs md:text-sm font-medium text-stone-700">
                    Address *
                  </Label>
              <Textarea
                id="address"
                name="address"
                value={schoolData.address}
                onChange={handleChange}
                    className="text-sm resize-none"
                rows={2}
                required
              />
            </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="website" className="text-xs md:text-sm font-medium text-stone-700">
                    Public site domain
                  </Label>
              <Input
                id="website"
                name="website"
                type="text"
                value={schoolData.website}
                onChange={handleChange}
                    className="h-9 md:h-10 text-sm"
                    placeholder="www.yourschool.ac.ke or https://www.yourschool.ac.ke"
              />
              <p className="text-xs text-stone-500">
                Used for the school&apos;s public website hostname when DNS points to this platform.
              </p>
            </div>
              </TabsContent>

              {/* School Details Tab */}
              <TabsContent value="details" className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="principalName" className="text-xs md:text-sm font-medium text-stone-700">
                      Principal Name
                    </Label>
              <Input
                id="principalName"
                name="principalName"
                value={schoolData.principalName}
                onChange={handleChange}
                      className="h-9 md:h-10 text-sm"
              />
            </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="establishedYear" className="text-xs md:text-sm font-medium text-stone-700">
                      Established Year
                    </Label>
              <Input
                id="establishedYear"
                name="establishedYear"
                value={schoolData.establishedYear}
                onChange={handleChange}
                      className="h-9 md:h-10 text-sm"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
              />
            </div>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="motto" className="text-xs md:text-sm font-medium text-stone-700">
                    School Motto
                  </Label>
              <Input
                id="motto"
                name="motto"
                value={schoolData.motto}
                onChange={handleChange}
                    className="h-9 md:h-10 text-sm"
                    placeholder="School motto or tagline"
              />
            </div>

              </TabsContent>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-3 md:space-y-4">
                <p className="text-xs text-stone-600">
                  Logo and colours apply to the school portal and any linked public page. Marketing
                  copy and photos for dedicated sites are edited in{" "}
                  <code className="rounded bg-stone-100 px-1 text-[10px]">public-schools/&lt;school&gt;/</code>.
                </p>
                <ColorPalettePicker
                  value={schoolData.colorPaletteSlug}
                  onChange={(slug, primary) =>
                    setSchoolData({ ...schoolData, colorPaletteSlug: slug, colorTheme: primary })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="colorTheme" className="text-xs md:text-sm font-medium text-stone-700">
                      Color Theme
                    </Label>
                    <div className="flex items-center gap-2">
                <input
                  id="colorTheme"
                  name="colorTheme"
                  type="color"
                  value={schoolData.colorTheme}
                  onChange={handleColorThemeChange}
                        className="w-10 h-9 rounded border cursor-pointer flex-shrink-0"
                />
                  <Input
                    value={schoolData.colorTheme}
                    onChange={handleColorThemeChange}
                        className="h-9 md:h-10 text-sm font-mono"
                  />
                </div>
              </div>
                  
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm font-medium text-stone-700">
                      School Logo
                    </Label>
                    <div className="rounded-lg border border-dashed border-amber-200 p-2 text-center transition-colors hover:border-amber-400 md:p-3">
                {logoPreview ? (
                        <div className="flex items-center gap-2 md:gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                            className="w-8 h-8 object-contain rounded flex-shrink-0"
                    />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-xs text-stone-600 truncate">{logoFile?.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                              className="h-6 text-xs mt-1"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview("")
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                              Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-6 w-6 text-amber-400" />
                    <div>
                            <p className="text-xs text-stone-600">Click to upload logo</p>
                      <p className="text-xs text-stone-500">PNG, JPG, GIF, or WebP — up to 5MB</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SCHOOL_LOGO_ACCEPT}
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
                </div>
                </div>

              </TabsContent>
            </Tabs>

            <div className="border-t border-amber-100 pt-3 md:pt-4">
            <Button
              type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 py-2.5 text-sm font-medium text-white hover:from-amber-700 hover:to-orange-700 md:py-3 md:text-base"
              disabled={isSubmitting}
            >
                {isSubmitting ? 'Creating School...' : 'Create School'}
            </Button>
              {error && (
                <div className="mt-2 rounded border border-orange-300 bg-orange-50 p-2 text-xs text-orange-900 md:p-3 md:text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 md:p-3 md:text-sm">
                  {success}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {showSuccessModal && (
        <SchoolCreationSuccess
          {...successData}
          onClose={handleSuccessModalClose}
        />
      )}
    </>
  )
}

export default AddSchoolForm
