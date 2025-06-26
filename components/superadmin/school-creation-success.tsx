"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  Link as LinkIcon,
  School
} from "lucide-react"

interface SchoolCreationSuccessProps {
  schoolCode: string
  tempPassword: string
  portalUrl: string
  schoolName: string
  adminEmail: string
  onClose: () => void
}

export function SchoolCreationSuccess({
  schoolCode,
  tempPassword,
  portalUrl,
  schoolName,
  adminEmail,
  onClose
}: SchoolCreationSuccessProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Auto-close after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 30000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Share via Email
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Hi-Tech SMS School Portal Credentials for ${schoolName}`)
    const body = encodeURIComponent(
      `Hello School Admin,\n\nYour school portal is ready!\n\nPortal URL: ${portalUrl}\nEmail: ${adminEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.\n\nBest regards,\nHi-Tech SMS Team`
    )
    window.open(`mailto:${adminEmail}?subject=${subject}&body=${body}`)
    onClose()
  }

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi! Your Hi-Tech SMS school portal is ready.\n\nPortal: ${portalUrl}\nEmail: ${adminEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`
    )
    window.open(`https://wa.me/?text=${text}`)
    onClose()
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const openPortal = () => {
    window.open(portalUrl, "_blank")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl">
        <CardHeader className="text-center bg-gray-50/50 p-6 rounded-t-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-green-700">School Created Successfully!</CardTitle>
          <CardDescription>
            <span className="block mb-2 text-base text-blue-700 font-semibold">
              Please share the credentials below with the school admin. You can use the Email or WhatsApp buttons for quick sharing.
            </span>
            The school portal is now ready for setup and configuration.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* School Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <School className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900 text-lg">School Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">School Name:</span>
                <p className="text-blue-800 font-semibold">{schoolName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">School Code:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono bg-white">{schoolCode}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(schoolCode, "code")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Portal URL */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <LinkIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-900 text-lg">Portal URL</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-purple-800">Share this URL with the school admin to access the portal:</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Badge variant="outline" className="font-mono text-xs text-left w-full break-all bg-white">
                  {portalUrl}
                </Badge>
                <div className="flex-shrink-0 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(portalUrl, "url")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={openPortal}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {copiedField === "url" && (
                <p className="text-xs text-green-600">URL copied to clipboard!</p>
              )}
              <Button
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  window.open(
                    `${portalUrl}?email=${encodeURIComponent(adminEmail)}&password=${encodeURIComponent(
                      tempPassword
                    )}&schoolName=${encodeURIComponent(schoolName)}`,
                    "_blank"
                  );
                }}
              >
                Go to Portal (Auto-fill Login)
              </Button>
            </div>
          </div>

          {/* Admin Credentials */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-900 text-lg">Admin Credentials</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-orange-800">Use these credentials to log in to the school portal:</p>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <Button onClick={handleShareEmail} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="w-4 h-4 mr-2" /> Share via Email
                </Button>
                <Button onClick={handleShareWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.19-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.44l-.38-.22-3.68.97.98-3.58-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.28.7.9.86.16.18.32.2.6.07.28-.14 1.18-.44 2.25-1.4.83-.74 1.39-1.65 1.55-1.93.16-.28.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.68 1.12 2.87.14.18 1.93 2.95 4.68 4.02.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/></svg>
                  Share via WhatsApp
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm truncate">{adminEmail}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-auto"
                    onClick={() => copyToClipboard(adminEmail, "email")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Password:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-mono">{showPassword ? tempPassword : "••••••••"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(tempPassword, "password")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {(copiedField === "email" || copiedField === "password") && (
                <p className="text-xs text-green-600">
                  {copiedField === "email" ? "Email" : "Password"} copied to clipboard!
                </p>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>The school admin should change their password on first login.</li>
              <li>The portal is currently in "Setup" mode and needs configuration.</li>
              <li>Save these credentials securely - they won't be shown again.</li>
              <li>The school admin can add teachers, students, and configure subjects.</li>
            </ul>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={openPortal}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open School Portal
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 