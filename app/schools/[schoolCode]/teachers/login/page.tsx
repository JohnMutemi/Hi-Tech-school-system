"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSchool } from "@/lib/school-storage"

export default function TeacherLoginPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [teachers, setTeachers] = useState<any[]>([])

  useState(() => {
    const school = getSchool(schoolCode)
    setTeachers(school?.teachers || [])
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const school = getSchool(schoolCode)
    if (!school || !school.teachers) {
      setError("School or teachers not found.")
      return
    }
    const teacher = school.teachers.find((t) => t.email === email && t.tempPassword === password)
    if (teacher) {
      localStorage.setItem("teacher-auth", JSON.stringify({ schoolCode, teacherId: teacher.id }))
      router.replace(`/schools/${schoolCode}/teacher`)
    } else {
      setError("Invalid email or password.")
    }
  }

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