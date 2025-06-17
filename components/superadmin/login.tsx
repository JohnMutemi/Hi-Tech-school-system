"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export function SuperAdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      // Simple client-side authentication for demo
      if (email === "admin@hitechsms.co.ke" && password === "admin123") {
        // Set a simple localStorage token
        localStorage.setItem("superadmin-auth", "true")
        localStorage.setItem("superadmin-email", email)

        // Redirect to dashboard
        window.location.href = "/superadmin"
      } else {
        alert("Invalid credentials. Please use:\nEmail: admin@hitechsms.co.ke\nPassword: admin123")
      }
    } catch (error) {
      alert("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="relative">
            {/* Main logo container */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
              <div className="bg-white rounded-md w-6 h-6 flex items-center justify-center transform -rotate-3">
                <div className="text-blue-600 font-bold text-xs">📚</div>
              </div>
            </div>
            {/* Tech indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Hi-Tech Super Admin</CardTitle>
        <CardDescription>Secure access to system administration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="admin@hitechsms.co.ke" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Protected system access only</p>
        </div>
      </CardContent>
    </Card>
  )
}
