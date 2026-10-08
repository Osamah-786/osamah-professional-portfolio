import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  if (origin) {
    try {
      sameOrigin = new URL(origin).origin === new URL(request.url).origin;
    } catch {
      sameOrigin = false;
    }
  }

  if (!sameOrigin) {
    return NextResponse.json(
      { loggedOut: false },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ loggedOut: true satisfies true });
  response.cookies.set(AUTH_COOKIE_NAME, "", expiredSessionCookieOptions());
  return response;
}
