"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Baby } from "lucide-react"

// Import the JSON data directly
import edusmsData from "@/data/edusms.json"

export default function ParentLoginPage({ params }: { params: { schoolCode: string } }) {
  const [parentEmail, setParentEmail] = useState("")
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

      console.log("Looking for parent with:", { parentEmail, schoolId: school.id })

      // Find parent by email and school
      const parentStudents = edusmsData.students.filter((s: any) => 
        s.parentEmail === parentEmail && 
        s.schoolId === school.id
      )

      console.log("Found parent students:", parentStudents)

      if (parentStudents.length === 0) {
        setError("Parent not found. Please check your email.")
        return
      }

      // For demo purposes, accept any password
      if (password.length < 3) {
        setError("Invalid password")
        return
      }

      // Use the parent email directly as the parent ID
      const parentId = parentEmail
      
      // Redirect to parent dashboard using the parent email
      router.push(`/schools/${params.schoolCode}/parent/${encodeURIComponent(parentId)}`)
      
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
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
            <Baby className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Parent Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your children's information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your email and password to continue
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
                <Label htmlFor="parentEmail">Email Address</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="Enter your email address"
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
                Email: parents.wilson@email.com, Password: parent123
              </p>
              <p className="text-xs text-gray-500">
                Email: mrs.davis@email.com, Password: parent123
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Brighton Academy:
              </p>
              <p className="text-xs text-gray-500">
                Email: rodriguez.family@email.com, Password: parent123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 