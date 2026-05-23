import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/home', '/onboarding']
const AUTH_PAGES = ['/join', '/login']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('forest_token')?.value
  const { pathname } = request.nextUrl

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (AUTH_PAGES.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/home/:path*', '/onboarding/:path*', '/join', '/login'],
}
