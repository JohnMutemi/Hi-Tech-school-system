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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 sm:h-20 sm:w-20">
          <div className="relative">
            <div className="flex h-10 w-10 rotate-3 transform items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 shadow-lg sm:h-14 sm:w-14">
              <div className="flex h-6 w-6 -rotate-3 transform items-center justify-center rounded-md bg-white sm:h-8 sm:w-8">
                <div className="text-base font-bold text-amber-700 sm:text-lg">📚</div>
              </div>
            </div>
            <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 sm:h-4 sm:w-4">
              <div className="h-1 w-1 animate-pulse rounded-full bg-white sm:h-1.5 sm:w-1.5"></div>
            </div>
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">Hi-Tech Super Admin</CardTitle>
        <CardDescription className="text-sm sm:text-base">Secure access to system administration</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {error && <p className="mb-4 text-center text-orange-700">{error}</p>}
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
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-base hover:from-amber-700 hover:to-orange-700 sm:py-6 sm:text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-stone-600 sm:text-sm">
          <p>Protected system access only</p>
        </div>
      </CardContent>
    </Card>
  )
}
