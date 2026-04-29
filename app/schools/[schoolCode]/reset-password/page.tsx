"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminResetPasswordPage({ params }: { params: { schoolCode: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!token) return setError("Reset token missing from this link.")
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.")
    if (newPassword !== confirmPassword) return setError("Passwords do not match.")

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/schools/${params.schoolCode}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess("Password updated successfully. You can now sign in.")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          router.push(`/schools/${params.schoolCode}`)
        }, 1200)
      } else {
        setError(data.error || "Could not reset password.")
      }
    } catch {
      setError("Could not reset password.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Admin Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
            {success && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/schools/${params.schoolCode}`)}
              >
                Back to Sign In
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
