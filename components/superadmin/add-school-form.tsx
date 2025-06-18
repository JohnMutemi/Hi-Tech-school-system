"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSchool } from "@/lib/actions/school-actions"
import { toast } from "sonner"

interface AddSchoolFormProps {
  onSuccess?: () => void
}

export default function AddSchoolForm({ onSuccess }: AddSchoolFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      const result = await createSchool(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("School created successfully")
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      toast.error("Failed to create school")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New School</CardTitle>
        <CardDescription>Fill in the details to add a new school</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name</Label>
              <Input id="name" name="name" placeholder="Enter school name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">School Code</Label>
              <Input id="code" name="code" placeholder="Enter school code" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" placeholder="Enter school address" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="Enter phone number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Enter email address" required />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create School"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
