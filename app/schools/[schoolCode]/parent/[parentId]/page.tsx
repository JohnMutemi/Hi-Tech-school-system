"use client"

import { ParentDashboard } from "@/components/parent-dashboard/parent-dashboard"

export default function ParentDashboardPage({ 
  params 
}: { 
  params: { schoolCode: string; parentId: string } 
}) {
  return (
    <ParentDashboard 
      schoolCode={params.schoolCode} 
      parentId={params.parentId} 
    />
  )
} 