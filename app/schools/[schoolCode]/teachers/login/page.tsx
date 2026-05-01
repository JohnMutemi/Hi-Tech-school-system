"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SchoolLoginShell } from "@/components/auth/school-login-shell"

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
    <SchoolLoginShell
      schoolCode={schoolCode}
      heading="Welcome Back!"
      subheading="Login to your school account"
      adminLoginHref={`/schools/${schoolCode}`}
    >
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
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </SchoolLoginShell>
  )
}