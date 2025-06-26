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
import { 
  School, 
  Upload, 
  Palette, 
  Link as LinkIcon, 
  Eye, 
  Copy,
  CheckCircle,
  AlertCircle
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
      setGeneratedPortalUrl(`https://app.yourdomain.com/schools/${code.toLowerCase()}`)
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
      <Card className="w-full max-w-2xl mx-auto rounded-3xl shadow-2xl border-2 border-blue-200 bg-white/95 p-6 md:p-10">
        <CardHeader className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
            <School className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-blue-800 mb-2 text-center drop-shadow-lg tracking-tight">
            Add New School
          </CardTitle>
          <CardDescription className="text-center text-gray-500 mb-6">
            Register a new school to the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="font-semibold text-gray-700 mb-1">School Name</Label>
              <Input
                id="name"
                name="name"
                value={schoolData.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="code" className="font-semibold text-gray-700 mb-1">School Code (Optional)</Label>
              <Input
                id="code"
                name="code"
                value={schoolData.code}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <Label htmlFor="description" className="font-semibold text-gray-700 mb-1">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={schoolData.description}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="email" className="font-semibold text-gray-700 mb-1">Admin Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={schoolData.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="font-semibold text-gray-700 mb-1">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={schoolData.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="address" className="font-semibold text-gray-700 mb-1">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={schoolData.address}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                rows={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="website" className="font-semibold text-gray-700 mb-1">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={schoolData.website}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <Label htmlFor="principalName" className="font-semibold text-gray-700 mb-1">Principal Name</Label>
              <Input
                id="principalName"
                name="principalName"
                value={schoolData.principalName}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <Label htmlFor="establishedYear" className="font-semibold text-gray-700 mb-1">Established Year</Label>
              <Input
                id="establishedYear"
                name="establishedYear"
                value={schoolData.establishedYear}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <Label htmlFor="motto" className="font-semibold text-gray-700 mb-1">School Motto</Label>
              <Input
                id="motto"
                name="motto"
                value={schoolData.motto}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <Label htmlFor="colorTheme" className="font-semibold text-gray-700 mb-1">Color Theme</Label>
              <div className="flex items-center space-x-3">
                <input
                  id="colorTheme"
                  name="colorTheme"
                  type="color"
                  value={schoolData.colorTheme}
                  onChange={handleColorThemeChange}
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    value={schoolData.colorTheme}
                    onChange={handleColorThemeChange}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="logo" className="font-semibold text-gray-700 mb-1">School Logo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-20 h-20 mx-auto object-contain rounded-lg border"
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{logoFile?.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview("")
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                        Remove Logo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
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
            <div>
              <Label htmlFor="generatedPortal" className="font-semibold text-gray-700 mb-1">Generated Portal</Label>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Portal URL:</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedPortalUrl)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {generatedPortalUrl}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(generatedPortalUrl, "_blank")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl text-lg shadow mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add School'}
            </Button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
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
