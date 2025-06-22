"use client"

import { useParams } from "next/navigation"
import { ParentDashboard } from "@/components/parent-dashboard/parent-dashboard"

export default function ParentDashboardPage() {
  const params = useParams()
  const schoolCode = params.schoolCode as string

  return <ParentDashboard schoolCode={schoolCode} />
} 