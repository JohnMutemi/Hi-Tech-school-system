import { Button } from "@/components/ui/button"
import { Play, CheckCircle } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Hi-Tech
                <br />
                <span className="text-slate-600">School Management</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Software
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Advanced School Management System in Kenya with cutting-edge technology and all essential
                functionalities required to manage your institution efficiently and automate everything remotely.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
              >
                <Link href="/demo">TRY FREE DEMO</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-gray-300">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                30-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                24/7 support
              </div>
            </div>
          </div>

          {/* Right Content - Device Mockups */}
          <div className="relative">
            <div className="relative z-10">
              {/* Laptop Mockup */}
              <div className="bg-gray-800 rounded-t-lg p-2 shadow-2xl">
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="bg-red-500 h-8 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-300 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-red-50 to-blue-50">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-red-500">1,247</div>
                        <div className="text-sm text-gray-600">Total Students</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-blue-500">89</div>
                        <div className="text-sm text-gray-600">Teachers</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-500">24</div>
                        <div className="text-sm text-gray-600">Classes</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Recent Activities</h3>
                        <div className="text-xs text-gray-500">Today</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm">New student registered</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="text-sm">Assignment submitted</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div className="text-sm">Fee payment received</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Mockup */}
              <div className="absolute -bottom-8 -right-8 w-32 bg-gray-800 rounded-2xl p-1 shadow-xl">
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="bg-red-500 h-6 flex items-center justify-center">
                    <div className="w-8 h-1 bg-red-300 rounded-full"></div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="bg-gray-100 h-3 rounded"></div>
                    <div className="bg-gray-100 h-3 rounded w-3/4"></div>
                    <div className="bg-red-100 h-8 rounded flex items-center justify-center">
                      <div className="w-4 h-1 bg-red-400 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
