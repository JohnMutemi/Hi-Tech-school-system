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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-muted-foreground">Loading…</p>
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
    <div className="mx-auto max-w-4xl">
      <AddSchoolForm />
    </div>
  )
}
