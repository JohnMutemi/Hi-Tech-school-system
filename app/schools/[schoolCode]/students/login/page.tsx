"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StudentLoginPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Debug logging
    console.log('Student login page params:', params)
    console.log('School code:', schoolCode)
    console.log('Search params:', Object.fromEntries(searchParams.entries()))
    
    // Auto-fill credentials from query params if present
    const admParam = searchParams.get("admissionNumber");
    const emailParam = searchParams.get("email");
    const passParam = searchParams.get("password");
    if (admParam) setAdmissionNumber(admParam);
    if (emailParam) setEmail(emailParam);
    if (passParam) setPassword(passParam);
  }, [searchParams, params, schoolCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`/api/schools/${schoolCode}/students/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionNumber, email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        router.replace(`/schools/${schoolCode}/student`)
      } else {
        const data = await res.json()
        setError(data.error || "Invalid credentials. Please check your admission number/email and password.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-2">
      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>Student Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              placeholder="Admission Number"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
            />
            <div className="text-center text-gray-400 text-xs">or</div>
            <Input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Temporary Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 