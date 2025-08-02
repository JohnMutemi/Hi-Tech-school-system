"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  School, 
  Upload, 
  Palette, 
  Link as LinkIcon, 
  Eye, 
  Copy,
  CheckCircle,
  AlertCircle,
  Building2,
  Contact,
  Settings,
  Image
} from "lucide-react"
import { saveSchool, getSchool, getAllSchools } from "@/lib/school-storage"
import { generateSchoolCode, generateTempPassword } from "@/lib/utils/school-generator"
import { SchoolCreationSuccess } from "./school-creation-success"
import { createSchoolClient } from "@/lib/actions/school-actions"
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
    colorTheme: "#3b82f6",
    description: "",
    website: "",
    principalName: "",
    establishedYear: new Date().getFullYear().toString(),
    motto: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState("")
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
    
    // Auto-generate portal URL when school name changes
    if (name === "name" && value) {
      const code = schoolData.code || generateSchoolCode(value)
      setGeneratedPortalUrl(`https://app.yourdomain.com/schools/${code.toUpperCase()}`)
    }
  }

  const generateSchoolCode = (schoolName: string): string => {
    const cleanName = schoolName.replace(/[^a-zA-Z]/g, "").toUpperCase()
    const prefix = cleanName.substring(0, 3) || "SCH"
    const suffix = Math.floor(Math.random() * 9000) + 1000
    return `${prefix}${suffix}`
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Logo file size must be less than 5MB")
        return
      }
      
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const { name, address, phone, email, code, colorTheme, description, website, principalName, establishedYear, motto } = schoolData

      // Validate required fields
      if (!name || !address || !phone || !email) {
        setError("All required fields must be filled")
        setIsSubmitting(false)
        return
      }

      // Handle logo upload if provided
      let logoUrl = ""
      if (logoFile) {
        try {
          // Create a data URL for the logo
          const reader = new FileReader()
          reader.onload = (e) => {
            logoUrl = e.target?.result as string
          }
          reader.readAsDataURL(logoFile)
        } catch (error) {
          console.error("Error processing logo:", error)
          // Continue without logo if there's an error
        }
      }

      // Create school using client-side function
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
        logoUrl
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
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
          colorTheme: "#3b82f6",
          description: "",
          website: "",
          principalName: "",
          establishedYear: new Date().getFullYear().toString(),
          motto: "",
        })
        setLogoFile(null)
        setLogoPreview("")
        setGeneratedPortalUrl("")
      }

    } catch (error) {
      console.error("Error creating school:", error)
      setError("Failed to create school. Please try again.")
    }

    setIsSubmitting(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard",
    })
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    router.push('/superadmin/schools')
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-gray-200 bg-white">
        <CardHeader className="pb-3 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
              <School className="w-5 h-5 text-blue-600" />
          </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            Add New School
          </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Register a new school to the platform
          </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-3 md:mb-4 h-10 md:h-9">
                <TabsTrigger value="basic" className="flex items-center justify-center gap-1 md:gap-2 text-xs px-2 md:px-3">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Basic</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center justify-center gap-1 md:gap-2 text-xs px-2 md:px-3">
                  <Contact className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Contact</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center justify-center gap-1 md:gap-2 text-xs px-2 md:px-3">
                  <Settings className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="branding" className="flex items-center justify-center gap-1 md:gap-2 text-xs px-2 md:px-3">
                  <Image className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Branding</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="name" className="text-xs md:text-sm font-medium text-gray-700">
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
                    <Label htmlFor="code" className="text-xs md:text-sm font-medium text-gray-700">
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
                  <Label htmlFor="description" className="text-xs md:text-sm font-medium text-gray-700">
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
                    <Label htmlFor="email" className="text-xs md:text-sm font-medium text-gray-700">
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
                    <Label htmlFor="phone" className="text-xs md:text-sm font-medium text-gray-700">
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
                  <Label htmlFor="address" className="text-xs md:text-sm font-medium text-gray-700">
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
                  <Label htmlFor="website" className="text-xs md:text-sm font-medium text-gray-700">
                    Website
                  </Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={schoolData.website}
                onChange={handleChange}
                    className="h-9 md:h-10 text-sm"
                    placeholder="https://example.com"
              />
            </div>
              </TabsContent>

              {/* School Details Tab */}
              <TabsContent value="details" className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="principalName" className="text-xs md:text-sm font-medium text-gray-700">
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
                    <Label htmlFor="establishedYear" className="text-xs md:text-sm font-medium text-gray-700">
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
                  <Label htmlFor="motto" className="text-xs md:text-sm font-medium text-gray-700">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="colorTheme" className="text-xs md:text-sm font-medium text-gray-700">
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
                    <Label className="text-xs md:text-sm font-medium text-gray-700">
                      School Logo
                    </Label>
                    <div className="border border-dashed border-gray-300 rounded-lg p-2 md:p-3 text-center hover:border-gray-400 transition-colors">
                {logoPreview ? (
                        <div className="flex items-center gap-2 md:gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                            className="w-8 h-8 object-contain rounded flex-shrink-0"
                    />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-xs text-gray-600 truncate">{logoFile?.name}</p>
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
                          <Upload className="w-6 h-6 mx-auto text-gray-400" />
                    <div>
                            <p className="text-xs text-gray-600">Click to upload logo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
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
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm font-medium text-gray-700">
                    Generated Portal URL
                  </Label>
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3 space-y-2">
                <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Portal URL:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                        className="h-6 text-xs"
                    onClick={() => copyToClipboard(generatedPortalUrl)}
                  >
                        <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs flex-1 text-left break-all">
                        {generatedPortalUrl || "Will be generated after school name is entered"}
                  </Badge>
                      {generatedPortalUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => window.open(generatedPortalUrl, "_blank")}
                  >
                          <Eye className="w-3 h-3" />
                  </Button>
                      )}
                </div>
              </div>
            </div>
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="pt-3 md:pt-4 border-t">
            <Button
              type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 md:py-3 rounded-lg text-sm md:text-base"
              disabled={isSubmitting}
            >
                {isSubmitting ? 'Creating School...' : 'Create School'}
            </Button>
              {error && (
                <div className="mt-2 p-2 md:p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs md:text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-2 p-2 md:p-3 bg-green-50 border border-green-200 rounded text-green-600 text-xs md:text-sm">
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
