import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Log all cookies and the path for debugging
  console.log('MIDDLEWARE COOKIES:', request.cookies.getAll())
  console.log('MIDDLEWARE PATH:', request.nextUrl.pathname)

  // Always allow access to the login page
  if (request.nextUrl.pathname === '/superadmin/login') {
    return NextResponse.next()
  }

  // Check for the session cookie
  const sessionCookie = request.cookies.get('hitechsms-session')
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/superadmin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all superadmin routes except the login page
    '/superadmin((?!/login).*)',
    '/superadmin'
  ],
} 