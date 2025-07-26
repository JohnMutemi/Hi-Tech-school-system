import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  // Redirect /schools/[schoolCode]/teacher/login to /schools/[schoolCode]/teachers/login
  const match = url.pathname.match(/^\/schools\/([^/]+)\/teacher\/login$/);
  if (match) {
    url.pathname = `/schools/${match[1]}/teachers/login`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all superadmin routes except the login page
    '/superadmin((?!/login).*)',
    '/superadmin'
  ],
} 