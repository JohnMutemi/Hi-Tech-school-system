"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function AddStudentPage() {
  const router = useRouter()
  const params = useParams()
  const schoolCode = params.schoolCode as string
  const [form, setForm] = useState({
    name: "",
    admissionNumber: "",
    email: "",
    className: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch(`/api/schools/${schoolCode}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      router.push(`/schools/${schoolCode}/students`)
    } else {
      setError("Failed to add student.")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
            <Input name="admissionNumber" placeholder="Admission Number" value={form.admissionNumber} onChange={handleChange} required />
            <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input name="className" placeholder="Class" value={form.className} onChange={handleChange} required />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 