"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TermsData {
  id: string
  version: string
  title: string
  content: string
}

export default function SchoolTermsPage({ params }: { params: { schoolCode: string } }) {
  const router = useRouter()
  const [terms, setTerms] = useState<TermsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const res = await fetch(`/api/schools/${params.schoolCode}/admin/terms`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Could not load terms.")
          return
        }
        if (!data.terms || data.accepted) {
          router.replace(`/schools/${params.schoolCode}`)
          return
        }
        setTerms(data.terms)
      } catch {
        setError("Could not load terms.")
      } finally {
        setLoading(false)
      }
    }
    loadTerms()
  }, [params.schoolCode, router])

  const handleAccept = async () => {
    setAccepting(true)
    setError("")
    try {
      const res = await fetch(`/api/schools/${params.schoolCode}/admin/terms/accept`, { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || "Could not accept terms.")
        return
      }
      router.replace(`/schools/${params.schoolCode}`)
    } catch {
      setError("Could not accept terms.")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading terms and conditions...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <CardTitle>{terms?.title || "Terms and Conditions"}</CardTitle>
          <CardDescription>Version {terms?.version || "-"}. Please accept to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[460px] overflow-y-auto rounded-md border p-4 whitespace-pre-wrap text-sm">
            {terms?.content || "No terms content available."}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleAccept} disabled={accepting} className="w-full">
            {accepting ? "Accepting..." : "I Accept Terms and Conditions"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
