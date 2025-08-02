import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "@/styles/mobile-responsive.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hi-Tech School Management Software",
  description: "Advanced School Management System in Kenya with cutting-edge technology and all essential functionalities required to manage your institution efficiently and automate everything remotely.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
