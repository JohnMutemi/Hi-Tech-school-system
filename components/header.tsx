"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Facebook, Twitter, Instagram } from "lucide-react"

const navLinks = [
  { label: "About", id: "about" },
  { label: "Features", id: "features" },
  { label: "Pricing", id: "pricing" },
  { label: "Contact", id: "contact" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Smooth scroll handler
  const handleNavClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      setIsMenuOpen(false)
    }
  }

  return (
    <>
      {/* Top Bar */}
      <div className="bg-slate-800 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="text-xs md:text-sm">HELP LINE: 0112240468</span>
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
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4">
          <div className="flex items-center gap-4">
            <img
              src="/hi-tech-logo.svg"
              alt="Hi-Tech SMS Logo"
              className="h-10 w-10 transition-transform duration-200 hover:scale-105 hover:drop-shadow-lg"
            />
            <span className="font-extrabold text-2xl text-blue-700 tracking-tight leading-tight">
              Hi-Tech <span className="text-slate-700 font-semibold">SMS</span>
            </span>
          </div>
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 text-white ml-2"
            >
              <Link href="/demo">Try Free Demo</Link>
            </Button>
          </nav>
          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-7 w-7 text-blue-700" />
          </button>
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
          className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end p-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col space-y-6 px-8 mt-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-gray-700 hover:text-blue-600 font-semibold text-left text-lg"
              >
                {link.label}
              </button>
            ))}
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full text-center mt-4"
            >
              <Link href="/demo">Try Free Demo</Link>
            </Button>
          </nav>
        </div>
      </div>
    </>
  )
}
