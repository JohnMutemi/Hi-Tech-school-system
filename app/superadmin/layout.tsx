"use client"

import { useUser, mutate } from "@/hooks/use-user"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, LayoutDashboard, School, TrendingUp, Settings, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Only enable user fetching if not on login page
  const isLoginPage = pathname === '/superadmin/login'
  const { user } = useUser({ enabled: !isLoginPage })

  useEffect(() => {
    if (!isLoginPage && user && (!user.isLoggedIn || user.role !== 'super_admin')) {
      router.replace('/superadmin/login')
    }
  }, [user, router, isLoginPage])

  // If on login page, just render children without any layout
  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user || (user && (!user.isLoggedIn || user.role !== 'super_admin'))) {
    // Don't render the sidebar or children
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const navigationItems = [
    { href: "/superadmin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/superadmin/schools", icon: School, label: "Schools" },
    { href: "/superadmin/analytics", icon: TrendingUp, label: "Analytics" },
    { href: "/superadmin/settings", icon: Settings, label: "Settings" },
  ]

  const handleLogout = async () => {
    await fetch('/api/superadmin/logout', { method: 'POST' })
    await mutate('/api/superadmin/user')
    router.push('/superadmin/login')
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden lg:flex flex-col h-screen sticky top-0 z-30">
        <div className="h-20 flex items-center justify-center border-b">
          <span className="font-bold text-xl text-blue-700">Hi-Tech SMS</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`} 
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto mb-6 px-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors justify-center"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden hover:bg-blue-50 h-12 w-12 rounded-xl">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <SheetTitle className="text-left text-white font-bold text-xl">Hi-Tech SMS</SheetTitle>
                    <p className="text-blue-100 text-sm mt-2">Super Admin Portal</p>
                  </SheetHeader>
                  <nav className="flex-1 py-6 space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
                      return (
                        <Link 
                          key={item.href}
                          href={item.href} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-4 px-6 py-4 rounded-xl font-medium transition-colors mx-3 ${
                            isActive ? "bg-blue-100 text-blue-700 shadow-md" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                          }`} 
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="w-6 h-6" /> {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                  <div className="mt-auto p-6 border-t">
                    <div className="mb-4 px-4 py-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <User className="w-5 h-5" />
                        <div>
                          <span className="font-medium">{user?.name || 'Admin'}</span>
                          <div className="text-xs text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors justify-center"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-blue-700">Hi-Tech SMS</span>
                <span className="text-xs text-gray-500">
                  {navigationItems.find(item => 
                    pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
                  )?.label || 'Super Admin'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{user?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 mobile-bottom-nav">
          <div className="flex justify-around">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 mobile-nav-transition ${
                    isActive 
                      ? "text-blue-600 bg-blue-50 nav-item-active" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
} 