"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function StudentDashboardPage() {
  const params = useParams()
  const schoolCode = params.schoolCode as string
  const studentId = params.studentId as string
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main student dashboard page
    router.replace(`/schools/${schoolCode}/student`)
  }, [schoolCode, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to student dashboard...</p>
      </div>
    </div>
  )
} 