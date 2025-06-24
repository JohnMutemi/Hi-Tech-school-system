"use client"

import { useParams } from "next/navigation"
import { ParentDashboard } from "@/components/parent-dashboard/parent-dashboard"

export default function ParentDashboardPage() {
  const params = useParams()
  const schoolCode = params.schoolCode as string

  // This page will use session-based authentication (no parentId in URL)
  return <ParentDashboard schoolCode={schoolCode} />
} 