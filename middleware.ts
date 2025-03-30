import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/verify-code',
  '/forgot-password',
  '/api/auth/session',
  '/api/auth/create-session',
  '/api/auth/logout',
];

// Check if a path should be public
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || 
    path.startsWith('/api/public/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/images/') ||
    path.includes('.') // Static files like .svg, .png, etc.
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to public paths without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check for auth cookie
  const authCookie = request.cookies.get('auth_session');
  
  // If no auth cookie and trying to access protected route, redirect to login
  if (!authCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // User has auth cookie, continue to protected route
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};