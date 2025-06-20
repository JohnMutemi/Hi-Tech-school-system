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
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
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
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <SuperAdminDashboard />
        </div>
      </main>
    </div>
  )
}
