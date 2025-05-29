import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // For now, let's simplify the middleware to avoid session issues
  // We'll handle authentication in the API routes themselves

  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/api/products") ||
    (request.nextUrl.pathname === "/api/cart" && request.method === "GET")

  // Allow public routes and auth routes to pass through
  if (isAuthRoute || isPublicRoute) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/api/:path*"],
}
