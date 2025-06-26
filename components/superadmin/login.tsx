"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { mutate } from "@/hooks/use-user"

export function SuperAdminLogin() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        await mutate('/api/superadmin/user')
        router.push('/superadmin')
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // if (user?.isLoggedIn) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <p>Redirecting...</p>
  //     </div>
  //   )
  // }

  return (
    <Card className="w-full max-w-md p-4 sm:p-6 md:p-8 shadow-2xl rounded-xl bg-white flex flex-col justify-center">
      <CardHeader className="text-center p-4 sm:p-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="relative">
            {/* Main logo container */}
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
              <div className="bg-white rounded-md w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transform -rotate-3">
                <div className="text-blue-600 font-bold text-base sm:text-lg">📚</div>
              </div>
            </div>
            {/* Tech indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">Hi-Tech Super Admin</CardTitle>
        <CardDescription className="text-sm sm:text-base">Secure access to system administration</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base sm:text-lg py-4 sm:py-6"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs sm:text-sm text-gray-600">
          <p>Protected system access only</p>
        </div>
      </CardContent>
    </Card>
  )
}
