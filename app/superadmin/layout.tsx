"use client"

import { useUser, mutate } from "@/hooks/use-user"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, LayoutDashboard, School, TrendingUp, Settings, Menu, User, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Only enable user fetching if not on login page
  const isLoginPage = pathname === '/superadmin/login'
  const { user } = useUser({ enabled: !isLoginPage })

  useEffect(() => {
    if (!isLoginPage && user && (!user.isLoggedIn || user.role !== 'super_admin')) {
      router.replace('/superadmin/login')
    }
  }, [user, router, isLoginPage])

  // Page transition effect
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  // If on login page, just render children without any layout
  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
    // Don't render the sidebar or children
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { href: "/superadmin", icon: LayoutDashboard, label: "Dashboard", badge: null },
    { href: "/superadmin/schools", icon: School, label: "Schools", badge: "12" },
    { href: "/superadmin/analytics", icon: TrendingUp, label: "Analytics", badge: null },
    { href: "/superadmin/settings", icon: Settings, label: "Settings", badge: null },
  ]

  const handleLogout = async () => {
    await fetch('/api/superadmin/logout', { method: 'POST' })
    await mutate('/api/superadmin/user')
    router.push('/superadmin/login')
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-aqua-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-teal-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

              {/* Desktop Sidebar */}
        <aside className="w-72 bg-white/80 backdrop-blur-xl shadow-2xl hidden lg:flex flex-col h-screen fixed left-0 top-0 z-30 border-r border-white/20">
        <div className="h-24 flex items-center justify-center border-b border-white/20 bg-gradient-to-r from-cyan-500 to-teal-500">
          <div className="text-center">
            <span className="font-bold text-2xl text-white tracking-tight">Hi-Tech SMS</span>
            <p className="text-cyan-100 text-sm mt-1">Super Admin Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 py-8 space-y-3 overflow-y-auto custom-scrollbar px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`group flex items-center gap-4 px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  isActive 
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25" 
                    : "text-gray-700 hover:bg-white/60 hover:text-cyan-700 hover:shadow-md"
                }`} 
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} /> 
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-0">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto mb-8 px-4">
          <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-cyan-50 rounded-2xl border border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl text-red-600 hover:bg-red-50 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md justify-center group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" /> 
            Logout
          </button>
        </div>
      </aside>

              {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen relative lg:ml-72">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/20 fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden hover:bg-cyan-50 h-12 w-12 rounded-2xl transition-all duration-300 hover:scale-105">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-white/95 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
                    <SheetTitle className="text-left text-white font-bold text-xl">Hi-Tech SMS</SheetTitle>
                    <p className="text-cyan-100 text-sm mt-2">Super Admin Portal</p>
                  </SheetHeader>
                  <nav className="flex-1 py-6 space-y-3 px-4">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
                      return (
                        <Link 
                          key={item.href}
                          href={item.href} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                            isActive 
                              ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg" 
                              : "text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-md"
                          }`} 
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="w-6 h-6" /> 
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-0">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                  <div className="mt-auto p-6 border-t border-white/20">
                                         <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-cyan-50 rounded-2xl">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center">
                           <User className="w-5 h-5 text-white" />
                         </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl text-red-600 hover:bg-red-50 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md justify-center"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900">Hi-Tech SMS</span>
                <span className="text-xs text-gray-500">
                  {navigationItems.find(item => 
                    pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
                  )?.label || 'Super Admin'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                <Search className="w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="border-0 bg-transparent p-0 h-auto text-sm w-32 focus:ring-0"
                />
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-2xl hover:bg-cyan-50 transition-all duration-300 hover:scale-105">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  3
                </Badge>
              </Button>
              
              {/* User Avatar */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{user?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content with Page Transitions */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-none mx-auto w-full pb-24 lg:pb-8 transition-all duration-500 pt-20 lg:pt-8 lg:ml-0 overflow-y-auto ${
          isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/20 shadow-2xl z-20">
          <div className="flex justify-around p-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-all duration-300 transform hover:scale-110 ${
                    isActive 
                      ? "text-cyan-600 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl shadow-md" 
                      : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50/50 rounded-2xl"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                  {item.badge && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Custom CSS for enhanced animations */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #0d9488);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #0f766e);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }
        
        /* Ensure sticky elements work properly */
        .sticky {
          position: -webkit-sticky;
          position: sticky;
        }
      `}</style>
    </div>
  )
} 