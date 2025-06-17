"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Facebook, Twitter, Instagram } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {/* Top Bar */}
      <div className="bg-slate-800 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>HELP LINE: +254112240468</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Facebook className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
            <Twitter className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
            <Instagram className="w-4 h-4 hover:text-pink-400 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {/* Main logo container */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                    <div className="bg-white rounded-lg w-8 h-8 flex items-center justify-center transform -rotate-3">
                      <div className="text-blue-600 font-bold text-sm">📚</div>
                    </div>
                  </div>
                  {/* Tech indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  {/* Circuit pattern overlay */}
                  <div className="absolute inset-0 rounded-xl opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 48 48">
                      <path d="M8 8h4v4h-4zM36 8h4v4h-4zM8 36h4v4h-4zM36 36h4v4h-4z" fill="white" />
                      <path d="M12 10h24M10 12v24M38 12v24M12 38h24" stroke="white" strokeWidth="1" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Hi-Tech SMS
                  </h1>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    School Management Software
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                ABOUT
              </button>
              <button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                FEATURES
              </button>
              <button
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                PRICING
              </button>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                CONTACT
              </button>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/demo">TRY FREE DEMO</Link>
              </Button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
                    setIsMenuOpen(false)
                  }}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  ABOUT
                </button>
                <button
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                    setIsMenuOpen(false)
                  }}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  FEATURES
                </button>
                <button
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                    setIsMenuOpen(false)
                  }}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  PRICING
                </button>
                <button
                  onClick={() => {
                    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                    setIsMenuOpen(false)
                  }}
                  className="text-gray-700 hover:text-blue-600 font-medium text-left"
                >
                  CONTACT
                </button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-fit"
                >
                  <Link href="/demo">TRY FREE DEMO</Link>
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
