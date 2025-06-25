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
      <header className="bg-white shadow sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="font-bold text-xl text-blue-700">HiTech School System</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Add nav links or login/signup buttons here */}
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
