"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle } from "lucide-react"

export function DemoForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 2000)
  }

  if (isSubmitted) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Demo Request Submitted!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in EduManage. Our team will contact you within 24 hours to schedule your
            personalized demo.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What's next?</strong>
              <br />• Our sales team will call you to understand your needs
              <br />• We'll set up a custom demo environment
              <br />• You'll get 30 days of free access to explore all features
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Your Free Demo</CardTitle>
        <CardDescription>
          Fill out the form below and we'll set up a personalized demo of Hi-Tech SMS for your school.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" placeholder="John" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" placeholder="Doe" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" type="email" placeholder="john@school.edu" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" type="tel" placeholder="+254 700 000 000" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name *</Label>
            <Input id="schoolName" placeholder="Your School Name" required />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolType">School Type *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select school type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary School</SelectItem>
                  <SelectItem value="secondary">Secondary School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="mixed">Mixed (Primary & Secondary)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentCount">Number of Students *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-100">1 - 100 students</SelectItem>
                  <SelectItem value="101-300">101 - 300 students</SelectItem>
                  <SelectItem value="301-600">301 - 600 students</SelectItem>
                  <SelectItem value="601-1000">601 - 1000 students</SelectItem>
                  <SelectItem value="1000+">1000+ students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Your Position *</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Select your position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="principal">Principal/Head Teacher</SelectItem>
                <SelectItem value="deputy">Deputy Principal</SelectItem>
                <SelectItem value="admin">School Administrator</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="it">IT Manager</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Specific Requirements (Optional)</Label>
            <Textarea
              id="requirements"
              placeholder="Tell us about any specific features or requirements you're looking for..."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Request Free Demo"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>By submitting this form, you agree to our Terms of Service and Privacy Policy. No spam, we promise!</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
