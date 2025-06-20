"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSchool } from "@/lib/school-storage"
import Link from "next/link"

export default function TeacherLoginPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams();

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem("teacher-auth")
    if (session) {
      const { teacherId } = JSON.parse(session)
      if (teacherId) {
        router.replace(`/schools/${schoolCode}/teacher/${teacherId}`)
        return
      }
    }
    setLoading(false)
  }, [router, schoolCode])

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/teachers`)
        if (!res.ok) throw new Error("Failed to fetch teachers")
        const data = await res.json()
        setTeachers(data)
      } catch (err) {
        setError("Could not load teachers. Please try again later.")
      }
    }
    fetchTeachers()
  }, [schoolCode])

  useEffect(() => {
    // Auto-fill credentials from query params if present
    const emailParam = searchParams.get("email");
    const passwordParam = searchParams.get("password");
    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const teacher = teachers.find((t) => t.email === email && t.teacherProfile?.tempPassword === password)
    if (teacher) {
      localStorage.setItem("teacher-auth", JSON.stringify({ schoolCode, teacherId: teacher.id }))
      router.replace(`/schools/${schoolCode}/teacher`)
    } else {
      setError("Invalid email or password.")
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-2">
      <Card className="w-full max-w-md mb-8">
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
              placeholder="Temporary Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 