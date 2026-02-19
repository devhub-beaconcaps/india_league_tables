import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard') ||
            req.nextUrl.pathname.startsWith('/issuers') ||
            req.nextUrl.pathname.startsWith('/arrangers') ||
            req.nextUrl.pathname.startsWith('/trustees') ||
            req.nextUrl.pathname.startsWith('/registrars') ||
            req.nextUrl.pathname.startsWith('/agencies')) {
          return token !== null;
        }
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/issuers/:path*',
    '/arrangers/:path*',
    '/trustees/:path*',
    '/registrars/:path*',
    '/agencies/:path*',
  ],
};
