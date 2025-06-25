"use client"

import { SuperAdminDashboard } from "@/components/superadmin/dashboard"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SuperAdminPage() {
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    if (user && (!user.isLoggedIn || user.role !== 'super_admin')) {
      router.replace('/superadmin/login')
    }
  }, [user, router])

  if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-800">Super Admin Dashboard</h1>
          <button
            onClick={async () => {
              await fetch('/api/superadmin/logout', { method: 'POST' })
              router.push('/superadmin/login')
            }}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-6 px-2 sm:px-4 flex flex-col gap-6">
        <SuperAdminDashboard />
      </main>
    </div>
  )
}
