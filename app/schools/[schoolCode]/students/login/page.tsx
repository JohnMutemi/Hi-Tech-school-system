"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getAllStudents(schoolCode: string) {
  const schools = JSON.parse(localStorage.getItem("schools-data") || "{}")
  const school = schools[schoolCode.toLowerCase()]
  return school?.students || []
}

export default function StudentLoginPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [students, setStudents] = useState<any[]>(getAllStudents(schoolCode))

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const students = getAllStudents(schoolCode)
    const student = students.find(
      (s) =>
        (s.admissionNumber === admissionNumber || (email && s.email === email)) &&
        s.tempPassword === password
    )
    if (student) {
      localStorage.setItem("student-auth", JSON.stringify({ schoolCode, studentId: student.id }))
      router.replace(`/schools/${schoolCode}/student`)
    } else {
      setError("Invalid credentials. Please check your admission number/email and password.")
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
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 