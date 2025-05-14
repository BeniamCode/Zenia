import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is a simplified example.
// Firebase Authentication is primarily client-side. For robust server-side protection with Next.js App Router,
// you'd typically verify an ID token (sent as a cookie or Authorization header) using Firebase Admin SDK in a server context (e.g., Route Handler or Server Action).
// Setting a simple cookie like 'firebaseAuthToken' on client-side login can provide basic UX enhancements but isn't fully secure on its own for protecting server-rendered content or API routes without server-side token verification.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Attempt to get auth status and role from cookies (these would be set on client-side after login)
  // For a more secure setup, these cookies should be httpOnly and secure, and the token verified server-side.
  const authTokenCookie = request.cookies.get('firebaseIdToken'); // Example: a cookie storing the Firebase ID token
  const userRoleCookie = request.cookies.get('userRole'); // Example: a cookie storing the user's role

  let isAuthenticated = !!authTokenCookie; // Basic check if token cookie exists
  let userRole = userRoleCookie?.value;

  // If you were to verify the token server-side here (e.g., in an edge function):
  // if (authTokenCookie) {
  //   try {
  //     const decodedToken = await someEdgeCompatibleFirebaseAdmin.auth().verifyIdToken(authTokenCookie.value);
  //     isAuthenticated = true;
  //     userRole = decodedToken.role; // Assuming role is a custom claim
  //   } catch (error) {
  //     isAuthenticated = false;
  //     userRole = undefined;
  //     // Potentially clear invalid cookies
  //     const response = NextResponse.next();
  //     response.cookies.delete('firebaseIdToken');
  //     response.cookies.delete('userRole');
  //     // ... then redirect or proceed based on path
  //   }
  // }


  const protectedRoutes = ['/dashboard', '/admin/dashboard', '/profile', '/settings', '/my-food-log', '/reports'];
  const adminRoutes = ['/admin/dashboard'];
  const authRoutes = ['/login', '/signup'];

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));


  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); // Optional: add redirect query
      return NextResponse.redirect(loginUrl);
    }
    
    if (isAdminRoute && userRole !== 'admin') {
      // If a non-admin tries to access an admin route, redirect them to their dashboard.
      // Optionally, show an access denied page or a toast message on the client side after redirect.
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Special case for root path if it's not an auth route and user is not authenticated
  if (pathname === '/' && !isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
  }
   if (pathname === '/' && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets like images, fonts if stored in /public/assets)
     * - files in the public root folder (e.g. site.webmanifest, robots.txt)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)', // Adjusted to ignore files with extensions in public
    '/', // Explicitly include the root path if not covered by the above
  ],
};
