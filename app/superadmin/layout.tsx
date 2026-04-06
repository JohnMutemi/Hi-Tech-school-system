"use client"

import { useUser, mutate } from "@/hooks/use-user"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useMemo, type CSSProperties } from "react"
import Link from "next/link"
import {
  LogOut,
  LayoutDashboard,
  School,
  TrendingUp,
  Settings,
  Menu,
  User,
  Bell,
  Search,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllSchools } from "@/lib/school-storage"
import { getSuperAdminTheme } from "@/lib/superadmin-accent-themes"
const SIDEBAR_W = "lg:w-72 lg:min-w-[18rem]"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolCount, setSchoolCount] = useState<number | null>(null)
  const t = getSuperAdminTheme("amber")

  const isLoginPage = pathname === "/superadmin/login"
  const { user } = useUser({ enabled: !isLoginPage })

  useEffect(() => {
    if (!isLoginPage && user && (!user.isLoggedIn || user.role !== "super_admin")) {
      router.replace("/superadmin/login")
    }
  }, [user, router, isLoginPage])

  useEffect(() => {
    if (isLoginPage) return
    let cancelled = false
    ;(async () => {
      try {
        const schools = await getAllSchools()
        if (!cancelled) setSchoolCount(Array.isArray(schools) ? schools.length : 0)
      } catch {
        if (!cancelled) setSchoolCount(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoginPage, pathname])

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [pathname])

  const navigationItems = useMemo(
    () => [
      { href: "/superadmin", icon: LayoutDashboard, label: "Dashboard", badge: null as string | null },
      {
        href: "/superadmin/schools",
        icon: School,
        label: "Schools",
        badge: schoolCount != null ? String(schoolCount) : null,
      },
      { href: "/superadmin/analytics", icon: TrendingUp, label: "Analytics", badge: null },
      { href: "/superadmin/settings", icon: Settings, label: "Settings", badge: null },
    ],
    [schoolCount]
  )

  const pageTitle = useMemo(() => {
    const match = navigationItems.find(
      (item) => pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
    )
    return match?.label ?? "Super Admin"
  }, [pathname, navigationItems])

  const handleLogout = async () => {
    await fetch("/api/superadmin/logout", { method: "POST" })
    await mutate("/api/superadmin/user")
    router.push("/superadmin/login")
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user || (user && (!user.isLoggedIn || user.role !== "super_admin"))) {
    return (
      <div
        className={`flex min-h-dvh items-center justify-center bg-gradient-to-br ${t.pageBg}`}
        style={
          {
            ["--sa-scroll-from" as string]: t.scrollbarFrom,
            ["--sa-scroll-to" as string]: t.scrollbarTo,
        } as CSSProperties
      }
    >
        <div className="text-center">
          <div
            className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-t-transparent ${t.spinner}`}
          />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex min-h-dvh bg-gradient-to-br ${t.pageBg}`}
      style={
        {
          ["--sa-scroll-from" as string]: t.scrollbarFrom,
          ["--sa-scroll-to" as string]: t.scrollbarTo,
        } as CSSProperties
      }
    >
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden ${SIDEBAR_W} flex-col border-r border-amber-200/40 bg-amber-50/50 shadow-sm backdrop-blur-md lg:flex`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-center border-b border-white/20 bg-gradient-to-r ${t.brandGradient} px-4`}
        >
          <div className="text-center">
            <span className="text-lg font-bold tracking-tight text-white">Hi-Tech SMS</span>
            <p className={`text-xs ${t.brandSubtle}`}>Super Admin</p>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? t.navActive : t.navInactive
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge !== "" && (
                  <Badge variant="secondary" className="shrink-0 border-0 bg-white/20 text-xs text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-amber-200/40 p-3">
          <div className="mb-3 rounded-xl border border-amber-200/50 bg-amber-50/80 p-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${t.userOrb}`}
              >
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name || "Admin"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors ${t.logout}`}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 shrink-0 border-b border-amber-200/50 bg-amber-50/40 shadow-sm backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-amber-900 hover:bg-amber-100/80 lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,20rem)] border-amber-200/50 bg-amber-50/40 p-0">
                <SheetHeader
                  className={`border-b bg-gradient-to-r ${t.brandGradient} p-4 text-left text-white`}
                >
                  <SheetTitle className="text-white">Hi-Tech SMS</SheetTitle>
                  <p className={`text-xs ${t.brandSubtle}`}>Super Admin Portal</p>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-3">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/superadmin" && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                          isActive ? t.sheetNavActive : "text-foreground hover:bg-amber-100/80"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                        {item.badge != null && item.badge !== "" && (
                          <Badge className="ml-auto" variant="secondary">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-xs text-muted-foreground">Hi-Tech SMS</p>
              <h1 className="truncate text-base font-semibold leading-tight">{pageTitle}</h1>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
              <h1 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h1>
              <div className="relative mx-4 hidden max-w-md flex-1 xl:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  className="h-9 pl-9"
                  readOnly
                  aria-readonly
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex text-amber-800 hover:bg-amber-100/80" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ${t.notifyDot}`} />
              </Button>
              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm hover:from-amber-700 hover:to-orange-700"
              >
                <Link href="/superadmin/schools/add">
                  <Plus className="mr-1 h-4 w-4" />
                  Add school
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main
          className={`min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${
            isLoading ? "opacity-60" : "opacity-100"
          } transition-opacity duration-200 backdrop-blur-[2px]`}
        >
          <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-amber-200/40 bg-white/35 p-4 shadow-lg backdrop-blur-md sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        <nav className="shrink-0 border-t border-amber-200/50 bg-amber-50/50 backdrop-blur-md lg:hidden">
          <div className="flex justify-around py-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-0 flex-1 flex-col items-center py-2 text-[10px] font-medium ${
                    isActive ? t.mobileTabActive : "text-muted-foreground"
                  }`}
                >
                  <Icon className="mb-0.5 h-5 w-5 shrink-0" />
                  <span className="truncate px-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, var(--sa-scroll-from), var(--sa-scroll-to));
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
