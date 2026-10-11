import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session";
import { callProjectsBackend, isSameOrigin } from "@/lib/api/projects-server";
import { isCrudBody } from "@/lib/api/crud-server";

export async function handleAccountSettingsPatch(
  request: Request,
  path: "/api/auth/username" | "/api/auth/password",
  invalidateSession = false,
) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }
  if (!isCrudBody(body)) return NextResponse.json({ code: "validation" }, { status: 400 });

  const result = await callProjectsBackend(path, "PATCH", body);
  if (result.status >= 200 && result.status < 300) {
    const response = NextResponse.json({ updated: true }, { status: 200 });
    if (invalidateSession) response.cookies.set(AUTH_COOKIE_NAME, "", expiredSessionCookieOptions());
    return response;
  }
  if (result.status === 400) return NextResponse.json({ code: "invalid_current_password" }, { status: 400 });
  if (result.status === 409) return NextResponse.json({ code: "username_taken" }, { status: 409 });
  if (result.status === 422) return NextResponse.json({ code: "validation" }, { status: 422 });
  if (result.status === 401 || result.status === 403) return NextResponse.json({ code: "unauthorized" }, { status: result.status });
  return NextResponse.json({ code: "unavailable" }, { status: 503 });
}
