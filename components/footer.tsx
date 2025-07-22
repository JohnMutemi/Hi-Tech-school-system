"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="md:col-span-2 lg:col-span-1 space-y-4">
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
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">School Management Software</p>
              </div>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed">
              Empowering educational institutions with cutting-edge technology and comprehensive management solutions
              for the digital age.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" aria-label="Facebook" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 dark:text-gray-500 hover:text-white cursor-pointer transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 dark:text-gray-500 hover:text-white cursor-pointer transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 dark:text-gray-500 hover:text-white cursor-pointer transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <Link href="/demo" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  Free Demo
                </Link>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-400 dark:text-gray-500 hover:text-white cursor-pointer transition-colors"
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
                <Link href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  Training
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  System Status
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
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
                <Phone className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-400 dark:text-gray-500">+254 112 240 468</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-400 dark:text-gray-500">info@hitechsms.co.ke</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span className="text-gray-400 dark:text-gray-500">Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Hi-Tech School Management Software. All rights reserved.
            <br className="sm:hidden" />
            Built with ❤️ for educational excellence.
          </p>
        </div>
      </div>
    </footer>
  )
}
