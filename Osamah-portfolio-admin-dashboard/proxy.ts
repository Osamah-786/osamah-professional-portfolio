import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isValidSessionCookie } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const hasValidSession = isValidSessionCookie(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (request.nextUrl.pathname === "/admin/login") {
    return hasValidSession
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  return hasValidSession
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
