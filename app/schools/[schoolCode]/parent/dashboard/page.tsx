"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ParentDashboard } from "@/components/parent-dashboard/parent-dashboard"

export default function ParentDashboardPage({ 
  params 
}: { 
  params: { schoolCode: string } 
}) {
  const [parentInfo, setParentInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get parent info from session storage
    if (typeof window !== 'undefined') {
      const session = sessionStorage.getItem('parentSession')
      if (session) {
        try {
          const parsed = JSON.parse(session)
          if (parsed.schoolCode === params.schoolCode) {
            setParentInfo(parsed)
          } else {
            // Wrong school, redirect to login
            router.push(`/schools/${params.schoolCode}/parent/login`)
          }
        } catch (error) {
          console.error('Error parsing session:', error)
          router.push(`/schools/${params.schoolCode}/parent/login`)
        }
      } else {
        // No session, redirect to login
        router.push(`/schools/${params.schoolCode}/parent/login`)
      }
    }
    setIsLoading(false)
  }, [params.schoolCode, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!parentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the parent dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <ParentDashboard 
      schoolCode={parentInfo.schoolCode} 
      parentId={parentInfo.parentId} 
    />
  )
} 