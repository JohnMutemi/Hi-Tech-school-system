"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap } from "lucide-react"

// Import the JSON data directly
import edusmsData from "@/data/edusms.json"

export default function StudentLoginPage({ params }: { params: { schoolCode: string } }) {
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Find school by code
      const school = edusmsData.schools.find((s: any) => s.code === params.schoolCode)
      if (!school) {
        setError("School not found")
        return
      }

      console.log("Looking for student with:", { admissionNumber, schoolId: school.id })

      // Find student by admission number and school
      const student = edusmsData.students.find((s: any) => 
        s.admissionNumber === admissionNumber && 
        s.schoolId === school.id
      )

      console.log("Found student:", student)

      if (!student) {
        setError("Invalid admission number")
        return
      }

      // For demo purposes, accept any password
      if (password.length < 3) {
        setError("Invalid password")
        return
      }

      // Redirect to student dashboard
      router.push(`/schools/${params.schoolCode}/student/${student.id}`)
      
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Student Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your student dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your admission number and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  type="text"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="Enter your admission number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Demo Credentials:
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Admission: STU001, Password: student123
              </p>
              <p className="text-xs text-gray-500">
                Admission: STU002, Password: student123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 