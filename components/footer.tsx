"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                {/* Main logo container */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                  <div className="bg-white rounded-md w-5 h-5 flex items-center justify-center transform -rotate-3">
                    <div className="text-blue-600 font-bold text-xs">📚</div>
                  </div>
                </div>
                {/* Tech indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Hi-Tech SMS
                </h3>
                <p className="text-xs text-gray-400 uppercase tracking-wide">School Management Software</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering educational institutions with cutting-edge technology and comprehensive management solutions
              for the digital age.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li>
                <Link href="/demo" className="text-gray-400 hover:text-white">
                  Free Demo
                </Link>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Training
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  System Status
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-500" />
                <span className="text-gray-400">+254 112 240 468</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-gray-400">info@hitechsms.co.ke</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-gray-400">Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>
            &copy; 2024 Hi-Tech School Management Software. All rights reserved. Built with ❤️ for educational
            excellence.
          </p>
        </div>
      </div>
    </footer>
  )
}
