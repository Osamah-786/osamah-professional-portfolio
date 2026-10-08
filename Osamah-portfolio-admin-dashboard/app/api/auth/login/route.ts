import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSessionCookieValue,
  getSessionExpiration,
  isSessionConfigurationReady,
  sessionCookieOptions,
} from "@/lib/auth/session";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false;

  const accessToken = Reflect.get(value, "access_token");
  const tokenType = Reflect.get(value, "token_type");
  return (
    typeof accessToken === "string" &&
    accessToken.length > 0 &&
    accessToken.length <= 3000 &&
    typeof tokenType === "string" &&
    tokenType.toLowerCase() === "bearer"
  );
}

function errorResponse(code: "invalid_credentials" | "unavailable", status: number) {
  const message =
    code === "invalid_credentials"
      ? "Invalid username or password."
      : "Unable to connect to the server. Please try again.";
  return NextResponse.json({ code, message }, { status });
}

function backendLoginUrl(): URL | null {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const baseUrl = new URL(configuredUrl);
    if (
      (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") ||
      baseUrl.username ||
      baseUrl.password ||
      (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:")
    ) {
      return null;
    }
    return new URL(`${baseUrl.toString().replace(/\/+$/, "")}/api/auth/login`);
  } catch {
    return null;
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ code: "unavailable", message: "Unable to connect to the server. Please try again." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_credentials", message: "Enter a username and password." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ code: "invalid_credentials", message: "Enter a username and password." }, { status: 400 });
  }

  const username = Reflect.get(body, "username");
  const password = Reflect.get(body, "password");
  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return NextResponse.json({ code: "invalid_credentials", message: "Enter a username and password." }, { status: 400 });
  }

  const url = backendLoginUrl();
  if (!url || !isSessionConfigurationReady()) {
    return errorResponse("unavailable", 503);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
      cache: "no-store",
    });
  } catch {
    return errorResponse("unavailable", 503);
  }

  if (response.status === 401) return errorResponse("invalid_credentials", 401);
  if (!response.ok) return errorResponse("unavailable", 503);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return errorResponse("unavailable", 502);
  }

  if (!isLoginResponse(payload)) return errorResponse("unavailable", 502);

  const sessionValue = createSessionCookieValue(payload.access_token);
  const expiration = getSessionExpiration(payload.access_token);
  if (!sessionValue || !expiration) return errorResponse("unavailable", 503);

  const result = NextResponse.json({ authenticated: true satisfies true });
  result.cookies.set(AUTH_COOKIE_NAME, sessionValue, sessionCookieOptions(expiration));
  return result;
}
