"use client"

import { useEffect, useState } from "react"
import AddSchoolForm from "@/components/superadmin/add-school-form"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"

export default function AddSchoolPage() {
  const router = useRouter()
  const { user } = useUser()

  if (user === undefined) {
    // Still loading user info
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user.isLoggedIn || user.role !== 'super_admin') {
    if (typeof window !== 'undefined') {
      router.replace('/superadmin/login')
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AddSchoolForm />
      </div>
    </div>
  )
}
