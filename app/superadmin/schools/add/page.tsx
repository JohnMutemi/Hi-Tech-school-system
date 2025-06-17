"use client"

import { useEffect, useState } from "react"
import AddSchoolForm from "@/components/superadmin/add-school-form"

export default function AddSchoolPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authStatus = localStorage.getItem("superadmin-auth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    } else {
      window.location.href = "/superadmin/login"
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New School</h1>
          <p className="text-gray-600 mt-2">Create a new school portal with unique branding and admin access.</p>
        </div>
        <AddSchoolForm />
      </div>
    </div>
  )
}
