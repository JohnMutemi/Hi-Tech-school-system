"use client"

import { useParams } from "next/navigation"
import { StudentDashboard } from "@/components/student-dashboard/student-dashboard"

export default function StudentDashboardPage() {
  const params = useParams()
  const schoolCode = params.schoolCode as string
  const studentId = params.studentId as string

  return <StudentDashboard schoolCode={schoolCode} studentId={studentId} />
} 