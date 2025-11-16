import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  const publicRoutes = ["/", "/login", "/signup", "/pricing", "/about", "/contact", "/privacy", "/terms"]

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check for auth session cookie
  const sessionToken = request.cookies.get("better-auth.session_token")

  // Redirect to login if no session on protected routes
  if (pathname.startsWith("/dashboard") && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
