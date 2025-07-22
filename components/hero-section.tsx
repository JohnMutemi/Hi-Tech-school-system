import { Button } from "@/components/ui/button"
import { Play, CheckCircle, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 dark:from-purple-500/5 dark:to-pink-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce delay-1000">
        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 dark:bg-blue-400 rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-40 right-20 animate-bounce delay-2000">
        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 dark:bg-purple-400 rounded-full opacity-60"></div>
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce delay-1500">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-4 sm:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-blue-200/50 dark:border-blue-700/50">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Kenya's Leading School Management Platform</span>
                <span className="sm:hidden">Leading Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Hi-Tech
                <br />
                <span className="text-slate-600 dark:text-slate-300">School Management</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent animate-pulse">
                  Software
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Advanced School Management System in Kenya with cutting-edge technology and all essential
                functionalities required to manage your institution efficiently and automate everything remotely.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white px-6 sm:px-8 py-4 sm:py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg font-semibold"
              >
                <Link href="/demo" className="flex items-center justify-center">
                  <span className="hidden sm:inline">TRY FREE DEMO</span>
                  <span className="sm:hidden">FREE DEMO</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold group"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Watch Demo</span>
                <span className="sm:hidden">Demo</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 justify-center lg:justify-start">
              <div className="flex items-center group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-2 sm:mr-3 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium">30-day free trial</span>
              </div>
              <div className="flex items-center group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-2 sm:mr-3 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium">No setup fees</span>
              </div>
              <div className="flex items-center group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-2 sm:mr-3 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium">24/7 support</span>
              </div>
            </div>
          </div>

          {/* Right Content - Enhanced Device Mockups */}
          <div className="relative mt-8 sm:mt-12 lg:mt-0">
            <div className="relative z-10 mx-auto max-w-sm sm:max-w-lg">
              {/* Laptop Mockup */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-t-xl p-2 sm:p-3 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 h-8 sm:h-10 flex items-center px-3 sm:px-4">
                    <div className="flex space-x-1.5 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-300 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-300 rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-300 rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-lg text-center border border-white/20 dark:border-gray-600/20 hover:shadow-xl transition-shadow">
                        <div className="text-lg sm:text-2xl font-bold text-red-500 dark:text-red-400 mb-1">1,247</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Total Students</div>
                      </div>
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-lg text-center border border-white/20 dark:border-gray-600/20 hover:shadow-xl transition-shadow">
                        <div className="text-lg sm:text-2xl font-bold text-blue-500 dark:text-blue-400 mb-1">89</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Teachers</div>
                      </div>
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-lg text-center border border-white/20 dark:border-gray-600/20 hover:shadow-xl transition-shadow">
                        <div className="text-lg sm:text-2xl font-bold text-green-500 dark:text-green-400 mb-1">24</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Classes</div>
                      </div>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg border border-white/20 dark:border-gray-600/20">
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Recent Activities</h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Today</div>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">New student registered</div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Assignment submitted</div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse delay-600"></div>
                          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Fee payment received</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Mockup */}
              <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 w-24 sm:w-32 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl transform hover:scale-110 transition-transform duration-500">
                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 h-4 sm:h-6 flex items-center justify-center">
                    <div className="w-6 h-0.5 sm:w-8 sm:h-1 bg-red-300 rounded-full"></div>
                  </div>
                  <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                    <div className="bg-gray-100 dark:bg-gray-700 h-1.5 sm:h-2 rounded animate-pulse"></div>
                    <div className="bg-gray-100 dark:bg-gray-700 h-1.5 sm:h-2 rounded w-3/4 animate-pulse delay-200"></div>
                    <div className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 h-6 sm:h-8 rounded flex items-center justify-center">
                      <div className="w-3 h-0.5 sm:w-4 sm:h-1 bg-red-400 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-xl border border-white/20 dark:border-gray-600/20">
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">50+</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Schools Trust Us</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
