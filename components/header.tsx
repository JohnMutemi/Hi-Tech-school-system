"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Facebook, Twitter, Instagram, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-white py-2 sm:py-3 px-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2 group">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium">HELP: 0112240468</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 mt-1 sm:mt-0">
            <a href="#" className="group p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300">
              <Facebook className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </a>
            <a href="#" className="group p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300">
              <Twitter className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </a>
            <a href="#" className="group p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300">
              <Instagram className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-3 sm:py-4 px-4">
          <div className="flex items-center gap-2 sm:gap-4 group">
            <div className="relative">
              <img
                src="/hi-tech-logo.svg"
                alt="Hi-Tech SMS Logo"
                className="h-8 w-8 sm:h-12 sm:w-12 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-2xl text-blue-700 dark:text-blue-400 tracking-tight leading-tight">
                Hi-Tech <span className="text-slate-700 dark:text-slate-300 font-semibold">SMS</span>
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">School Management Software</span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-300 relative group"
              >
                {link.label}
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></div>
              </button>
            ))}
            <ThemeToggle />
            <Button
              asChild
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 sm:px-6 py-2 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
            >
              <Link href="/demo" className="flex items-center">
                <span className="hidden sm:inline">Try Free Demo</span>
                <span className="sm:hidden">Demo</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </nav>

          {/* Tablet Nav */}
          <nav className="hidden md:flex lg:hidden items-center gap-4">
            <ThemeToggle />
            <Button
              asChild
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm"
            >
              <Link href="/demo" className="flex items-center">
                Demo
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </nav>
          
          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700 dark:text-blue-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src="/hi-tech-logo.svg"
                alt="Hi-Tech SMS Logo"
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              <span className="font-bold text-base sm:text-lg text-blue-700 dark:text-blue-400">Hi-Tech SMS</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(false)}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
          
          <nav className="flex flex-col space-y-1 p-4 sm:p-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold text-base sm:text-lg rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100" />
                </div>
              </button>
            ))}
            
            <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 mt-4 sm:mt-6">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-base sm:text-lg font-semibold shadow-lg group"
              >
                <Link href="/demo" className="flex items-center justify-center">
                  Try Free Demo
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            {/* Contact Info in Mobile Menu */}
            <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm">+254 112 240 468</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-sm">24/7 Support Available</span>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
