import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Get session from cookie
  const token = request.cookies.get('session')?.value;

  if (!token) {
    // Not authenticated, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const session = verified.payload as { userId: string; username: string; role: 'admin' | 'enterer' };

    // Check if enterer is trying to access admin-only pages
    if (session.role === 'enterer') {
      if (pathname.startsWith('/export') || pathname.startsWith('/accounts')) {
        const url = request.nextUrl.clone();
        url.pathname = '/ravisabha';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login).*)',
  ],
};
