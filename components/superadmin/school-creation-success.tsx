"use client"

import { useState } from "react"
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
          <CardDescription>The school portal is now ready for setup and configuration.</CardDescription>
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