import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getTokenFromSessionCookie } from "@/lib/auth/session";

export type BackendResult = { status: number; body?: unknown };

function apiUrl(path: string): URL | null {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return null;
  try {
    const base = new URL(configured);
    if (
      (base.protocol !== "http:" && base.protocol !== "https:") || base.username || base.password ||
      (process.env.NODE_ENV === "production" && base.protocol !== "https:")
    ) return null;
    return new URL(`${base.toString().replace(/\/+$/, "")}${path}`);
  } catch {
    return null;
  }
}

export async function callProjectsBackend(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<BackendResult> {
  const url = apiUrl(path);
  if (!url) return { status: 503 };
  const cookieStore = await cookies();
  const token = getTokenFromSessionCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!token) return { status: 401 };

  const headers = new Headers({ Accept: "application/json", Authorization: `Bearer ${token}` });
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isMultipart) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isMultipart ? body : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { status: 503 };
  }

  if (response.status === 204) return { status: 204 };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: response.ok ? 502 : response.status };
  }
  return { status: response.status, body: payload };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function publicErrorStatus(status: number): number {
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 422) return status;
  if (status >= 200 && status < 300) return status;
  return 503;
}
