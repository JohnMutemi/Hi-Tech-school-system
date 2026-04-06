export const SUPERADMIN_ACCENT_STORAGE_KEY = "hitechsms-superadmin-accent"

export type SuperAdminAccentId = "ruby" | "ocean" | "violet" | "amber" | "slate"

export type SuperAdminAccentTheme = {
  id: SuperAdminAccentId
  label: string
  /** Page background gradient (Tailwind arbitrary) */
  pageBg: string
  /** Sidebar / sheet title bar */
  brandGradient: string
  brandSubtle: string
  navActive: string
  navInactive: string
  userOrb: string
  logout: string
  sheetNavActive: string
  mobileTabActive: string
  notifyDot: string
  spinner: string
  /** Swatch for picker */
  swatch: string
  scrollbarFrom: string
  scrollbarTo: string
}

export const SUPERADMIN_ACCENT_THEMES: SuperAdminAccentTheme[] = [
  {
    id: "ruby",
    label: "Ruby",
    pageBg: "from-red-50/90 via-slate-50 to-slate-100",
    brandGradient: "from-red-600 to-red-700",
    brandSubtle: "text-red-100",
    navActive: "bg-red-600 text-white shadow-md",
    navInactive: "text-foreground hover:bg-red-50 hover:text-red-800",
    userOrb: "bg-red-600",
    logout: "text-red-600 hover:bg-red-50",
    sheetNavActive: "bg-red-600 text-white",
    mobileTabActive: "text-red-600",
    notifyDot: "bg-red-500",
    spinner: "border-red-600",
    swatch: "bg-gradient-to-br from-red-500 to-red-800",
    scrollbarFrom: "#dc2626",
    scrollbarTo: "#b91c1c",
  },
  {
    id: "ocean",
    label: "Ocean",
    pageBg: "from-cyan-50/90 via-slate-50 to-teal-50/80",
    brandGradient: "from-cyan-600 to-teal-700",
    brandSubtle: "text-cyan-100",
    navActive: "bg-cyan-600 text-white shadow-md",
    navInactive: "text-foreground hover:bg-cyan-50 hover:text-cyan-900",
    userOrb: "bg-cyan-600",
    logout: "text-cyan-700 hover:bg-cyan-50",
    sheetNavActive: "bg-cyan-600 text-white",
    mobileTabActive: "text-cyan-600",
    notifyDot: "bg-cyan-500",
    spinner: "border-cyan-600",
    swatch: "bg-gradient-to-br from-cyan-500 to-teal-700",
    scrollbarFrom: "#0891b2",
    scrollbarTo: "#0f766e",
  },
  {
    id: "violet",
    label: "Violet",
    pageBg: "from-violet-50/90 via-slate-50 to-fuchsia-50/70",
    brandGradient: "from-violet-600 to-fuchsia-700",
    brandSubtle: "text-violet-100",
    navActive: "bg-violet-600 text-white shadow-md",
    navInactive: "text-foreground hover:bg-violet-50 hover:text-violet-900",
    userOrb: "bg-violet-600",
    logout: "text-violet-700 hover:bg-violet-50",
    sheetNavActive: "bg-violet-600 text-white",
    mobileTabActive: "text-violet-600",
    notifyDot: "bg-violet-500",
    spinner: "border-violet-600",
    swatch: "bg-gradient-to-br from-violet-500 to-fuchsia-700",
    scrollbarFrom: "#7c3aed",
    scrollbarTo: "#6d28d9",
  },
  {
    id: "amber",
    label: "Amber",
    pageBg: "from-amber-50/90 via-slate-50 to-orange-50/70",
    brandGradient: "from-amber-500 to-orange-600",
    brandSubtle: "text-amber-50",
    navActive: "bg-amber-600 text-white shadow-md",
    navInactive: "text-foreground hover:bg-amber-50 hover:text-amber-900",
    userOrb: "bg-amber-600",
    logout: "text-amber-700 hover:bg-amber-50",
    sheetNavActive: "bg-amber-600 text-white",
    mobileTabActive: "text-amber-600",
    notifyDot: "bg-amber-500",
    spinner: "border-amber-600",
    swatch: "bg-gradient-to-br from-amber-400 to-orange-600",
    scrollbarFrom: "#d97706",
    scrollbarTo: "#c2410c",
  },
  {
    id: "slate",
    label: "Slate",
    pageBg: "from-slate-100/95 via-slate-50 to-zinc-100/90",
    brandGradient: "from-slate-700 to-slate-900",
    brandSubtle: "text-slate-300",
    navActive: "bg-slate-800 text-white shadow-md",
    navInactive: "text-foreground hover:bg-slate-100 hover:text-slate-900",
    userOrb: "bg-slate-700",
    logout: "text-slate-700 hover:bg-slate-100",
    sheetNavActive: "bg-slate-800 text-white",
    mobileTabActive: "text-slate-800",
    notifyDot: "bg-slate-500",
    spinner: "border-slate-700",
    swatch: "bg-gradient-to-br from-slate-600 to-slate-900",
    scrollbarFrom: "#475569",
    scrollbarTo: "#1e293b",
  },
]

export function getSuperAdminTheme(id: SuperAdminAccentId): SuperAdminAccentTheme {
  return (
    SUPERADMIN_ACCENT_THEMES.find((t) => t.id === id) ??
    SUPERADMIN_ACCENT_THEMES.find((t) => t.id === "amber")!
  )
}
