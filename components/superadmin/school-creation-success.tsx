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
  School,
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
  onClose,
}: SchoolCreationSuccessProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 30000)
    return () => clearTimeout(timer)
  }, [onClose])

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Hi-Tech SMS School Portal Credentials for ${schoolName}`)
    const body = encodeURIComponent(
      `Hello School Admin,\n\nYour school portal is ready!\n\nStaff portal: ${portalUrl}\nEmail: ${adminEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.\n\nBest regards,\nHi-Tech SMS Team`
    )
    window.open(`mailto:${adminEmail}?subject=${subject}&body=${body}`)
    onClose()
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi! Your Hi-Tech SMS school portal is ready.\n\nStaff portal: ${portalUrl}\nEmail: ${adminEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl">
        <CardHeader className="rounded-t-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 p-6 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <CheckCircle className="h-8 w-8 text-amber-700" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-amber-950 md:text-3xl">School Created Successfully!</CardTitle>
          <CardDescription>
            <span className="mb-2 block text-base font-semibold text-amber-900">
              Please share the credentials below with the school admin. You can use the Email or WhatsApp buttons for
              quick sharing.
            </span>
            The school portal is now ready for setup and configuration.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4">
            <div className="mb-3 flex items-center space-x-3">
              <div className="rounded-full bg-amber-200/80 p-2">
                <School className="h-5 w-5 text-amber-800" />
              </div>
              <h3 className="text-lg font-semibold text-amber-950">School Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="font-medium text-stone-600">School Name:</span>
                <p className="font-semibold text-amber-950">{schoolName}</p>
              </div>
              <div>
                <span className="font-medium text-stone-600">School Code:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-white font-mono">
                    {schoolCode}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(schoolCode, "code")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>


          <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4">
            <div className="mb-3 flex items-center space-x-3">
              <div className="rounded-full bg-orange-200/70 p-2">
                <LinkIcon className="h-5 w-5 text-orange-800" />
              </div>
              <h3 className="text-lg font-semibold text-orange-950">Portal URL</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-orange-950/90">Staff portal (private login for admins and finance).</p>
              <div className="flex flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <Badge variant="outline" className="w-full break-all bg-white text-left font-mono text-xs">
                  {portalUrl}
                </Badge>
                <div className="flex flex-shrink-0 space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(portalUrl, "url")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openPortal}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {copiedField === "url" && <p className="text-xs text-amber-800">URL copied to clipboard!</p>}
              <Button
                className="mt-4 w-full border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700"
                onClick={() => {
                  window.open(
                    `${portalUrl}?email=${encodeURIComponent(adminEmail)}&password=${encodeURIComponent(
                      tempPassword
                    )}&schoolName=${encodeURIComponent(schoolName)}`,
                    "_blank"
                  )
                }}
              >
                Go to Portal (Auto-fill Login)
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4">
            <div className="mb-3 flex items-center space-x-3">
              <div className="rounded-full bg-amber-200/80 p-2">
                <Lock className="h-5 w-5 text-amber-900" />
              </div>
              <h3 className="text-lg font-semibold text-amber-950">Admin Credentials</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-amber-950/90">Use these credentials to log in to the school portal:</p>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleShareEmail}
                  className="flex-1 border-0 bg-amber-600 text-white hover:bg-amber-700"
                >
                  <Mail className="mr-2 h-4 w-4" /> Share via Email
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-900 hover:bg-amber-100"
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.19-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.44l-.38-.22-3.68.97.98-3.58-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.28.7.9.86.16.18.32.2.6.07.28-.14 1.18-.44 2.25-1.4.83-.74 1.39-1.65 1.55-1.93.16-.28.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.68 1.12 2.87.14.18 1.93 2.95 4.68 4.02.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z" />
                  </svg>
                  Share via WhatsApp
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 flex-shrink-0 text-amber-700" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="truncate text-sm">{adminEmail}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={() => copyToClipboard(adminEmail, "email")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 flex-shrink-0 text-amber-700" />
                  <span className="text-sm font-medium">Password:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-sm">{showPassword ? tempPassword : "••••••••"}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(tempPassword, "password")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {(copiedField === "email" || copiedField === "password") && (
                <p className="text-xs text-amber-800">
                  {copiedField === "email" ? "Email" : "Password"} copied to clipboard!
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <h3 className="mb-2 font-semibold text-amber-950">Important Notes:</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-950/90">
              <li>The school admin should change their password on first login.</li>
              <li>The portal is currently in &quot;Setup&quot; mode and needs configuration.</li>
              <li>Save these credentials securely - they won&apos;t be shown again.</li>
              <li>The school admin can add teachers, students, and configure subjects.</li>
            </ul>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={openPortal}
              className="flex-1 border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open School Portal
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 border-amber-300 hover:bg-amber-50">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
