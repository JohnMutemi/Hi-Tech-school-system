"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageSquare, ArrowRight } from "lucide-react"

export function ContactSection() {
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

  return (
    <section id="contact" className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200/50 mb-6">
            <MessageSquare className="w-4 h-4" />
            Get In Touch
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your School?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Contact us today for a personalized consultation and demo. Our team is ready to help you get started.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-900">Phone Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 mb-2">+254 112 240 468</p>
                <p className="text-gray-600">Available 24/7 for urgent support</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="font-bold text-gray-900">Email Us</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900 mb-2">info@hitechsms.co.ke</p>
                <p className="text-gray-600">We'll respond within 2 hours</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="font-bold text-gray-900">Visit Our Office</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 font-semibold mb-2">Nairobi, Kenya</p>
                <p className="text-gray-600">Schedule an appointment for in-person consultation</p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="font-bold text-gray-900">Business Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monday - Friday:</span>
                    <span className="text-gray-900 font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Saturday:</span>
                    <span className="text-gray-900 font-medium">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sunday:</span>
                    <span className="text-gray-900 font-medium">Emergency only</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-2xl">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  Send Us a Message
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Fill out the form below and our team will get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative z-10">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent Successfully!</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Thank you for contacting us. Our team will review your message and respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="contactFirstName" className="text-gray-700 font-medium">First Name *</Label>
                        <Input 
                          id="contactFirstName" 
                          placeholder="John" 
                          required 
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="contactLastName" className="text-gray-700 font-medium">Last Name *</Label>
                        <Input 
                          id="contactLastName" 
                          placeholder="Doe" 
                          required 
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="contactEmail" className="text-gray-700 font-medium">Email Address *</Label>
                        <Input 
                          id="contactEmail" 
                          type="email" 
                          placeholder="john@school.edu" 
                          required 
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="contactPhone" className="text-gray-700 font-medium">Phone Number *</Label>
                        <Input 
                          id="contactPhone" 
                          type="tel" 
                          placeholder="+254 700 000 000" 
                          required 
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="contactSchool" className="text-gray-700 font-medium">School Name</Label>
                      <Input 
                        id="contactSchool" 
                        placeholder="Your School Name" 
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="contactSubject" className="text-gray-700 font-medium">Subject *</Label>
                      <Select required>
                        <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Request Demo</SelectItem>
                          <SelectItem value="pricing">Pricing Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="contactMessage" className="text-gray-700 font-medium">Message *</Label>
                      <Textarea 
                        id="contactMessage" 
                        placeholder="Tell us how we can help you..." 
                        rows={5} 
                        required 
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Sending...
                        </div>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
                          Send Message
                          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
