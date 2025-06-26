"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TeacherLoginPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    // Auto-fill credentials from query params if present
    const emailParam = searchParams.get("email");
    const passwordParam = searchParams.get("password");
    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const res = await fetch(`/api/schools/${schoolCode}/teachers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.replace(`/schools/${schoolCode}/teacher`)
      } else {
        const data = await res.json()
        setError(data.error || "Invalid email or password.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <img
        src="/library-bg.jpg"
        alt="Library background"
        className="absolute inset-0 w-full h-full object-cover object-center"
        draggable={false}
      />
      {/* Login card, centered with glassmorphism */}
      <div className="relative z-10 flex items-center justify-center w-full min-h-screen">
        <Card className="w-full max-w-sm mb-8 p-2 sm:p-4 rounded-xl shadow-xl bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Teacher Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password or Temporary Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}