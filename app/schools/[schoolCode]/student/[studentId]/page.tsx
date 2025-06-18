"use client"

import { StudentDashboard } from "@/components/student-dashboard/student-dashboard"

export default function StudentDashboardPage({ 
  params 
}: { 
  params: { schoolCode: string; studentId: string } 
}) {
  return (
    <StudentDashboard 
      schoolCode={params.schoolCode} 
      studentId={params.studentId} 
    />
  )
} 