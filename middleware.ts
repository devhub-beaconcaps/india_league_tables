import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }: { req: NextRequest; token: any }) {
        const protectedPaths = [
          "/dashboard",
          "/issuers",
          "/arrangers",
          "/trustees",
          "/registrars",
          "/agencies",
        ];

        const isProtected = protectedPaths.some((path) =>
          req.nextUrl.pathname.startsWith(path)
        );

        if (isProtected) {
          return token !== null;
        }

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/issuers/:path*",
    "/arrangers/:path*",
    "/trustees/:path*",
    "/registrars/:path*",
    "/agencies/:path*",
  ],
};
