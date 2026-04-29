"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyOtpPage({ params }: { params: { schoolCode: string } }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const getTwoFactorToken = () =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(`admin_2fa_token_${params.schoolCode}`) || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setInfo("")
    setIsSubmitting(true)
    try {
      const twoFactorToken = getTwoFactorToken()
      if (!twoFactorToken) {
        setError("Verification session expired. Please login again.")
        router.replace(`/schools/${params.schoolCode}`)
        return
      }

      const res = await fetch(`/api/schools/${params.schoolCode}/admin/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          res.status === 503
            ? "Database connection is temporarily unavailable. Please retry shortly."
            : data.error || "Invalid verification code."
        )
        return
      }

      sessionStorage.removeItem(`admin_2fa_token_${params.schoolCode}`)
      if (data.requiresTermsAcceptance) {
        router.replace(`/schools/${params.schoolCode}/terms`)
      } else {
        router.replace(`/schools/${params.schoolCode}`)
      }
    } catch {
      setError("Could not verify code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setInfo("")
    setIsResending(true)
    try {
      const twoFactorToken = getTwoFactorToken()
      if (!twoFactorToken) {
        setError("Verification session expired. Please login again.")
        router.replace(`/schools/${params.schoolCode}`)
        return
      }

      const res = await fetch(`/api/schools/${params.schoolCode}/admin/resend-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken }),
      })
      const data = await res.json()
      if (res.ok) setInfo(data.message || "A new verification code has been sent.")
      else setError(data.error || "Could not resend verification code.")
    } catch {
      setError("Could not resend verification code.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>Enter the one-time code sent to your admin email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-blue-700">{info}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify and Continue"}
            </Button>
            <Button type="button" variant="link" className="w-full text-sm" onClick={handleResend} disabled={isResending}>
              {isResending ? "Resending code..." : "Resend verification code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
