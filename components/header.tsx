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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="text-xs md:text-sm">HELP LINE: +254112240468</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-2 md:mt-0">
            <Facebook className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
            <Twitter className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
            <Instagram className="w-4 h-4 hover:text-pink-400 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                  <div className="bg-white rounded-md w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transform -rotate-3">
                    <div className="text-blue-600 font-bold text-lg">📚</div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hi-Tech SMS
                </h1>
                <p className="hidden md:block text-xs text-gray-500 uppercase tracking-wide font-medium">
                  School Management Software
                </p>
              </div>
            </Link>

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
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end p-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col space-y-6 px-6">
            <button
              onClick={() => {
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                setIsMenuOpen(false);
              }}
              className="text-gray-700 hover:text-blue-600 font-medium text-left text-lg"
            >
              ABOUT
            </button>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                setIsMenuOpen(false);
              }}
              className="text-gray-700 hover:text-blue-600 font-medium text-left text-lg"
            >
              FEATURES
            </button>
            <button
              onClick={() => {
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                setIsMenuOpen(false);
              }}
              className="text-gray-700 hover:text-blue-600 font-medium text-left text-lg"
            >
              PRICING
            </button>
            <button
              onClick={() => {
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                setIsMenuOpen(false);
              }}
              className="text-gray-700 hover:text-blue-600 font-medium text-left text-lg"
            >
              CONTACT
            </button>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full text-center"
            >
              <Link href="/demo">TRY FREE DEMO</Link>
            </Button>
          </nav>
        </div>
      </div>
    </>
  )
}
