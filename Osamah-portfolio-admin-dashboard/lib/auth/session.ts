import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE_BASE_NAME = "portfolio_admin_session";
const MAX_COOKIE_LENGTH = 3800;

export const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? `__Host-${SESSION_COOKIE_BASE_NAME}`
    : SESSION_COOKIE_BASE_NAME;

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32 || secret.includes("<") || secret.includes(">")) {
    return null;
  }
  return secret;
}

export function isSessionConfigurationReady(): boolean {
  return sessionSecret() !== null;
}

function getTokenExpiration(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return null;

  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (typeof payload !== "object" || payload === null) return null;

    const subject = Reflect.get(payload, "sub");
    const expiration = Reflect.get(payload, "exp");
    if (
      typeof subject !== "string" ||
      !/^\d+$/.test(subject) ||
      typeof expiration !== "number" ||
      !Number.isFinite(expiration) ||
      expiration <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return expiration;
  } catch {
    return null;
  }
}

export function getSessionExpiration(token: string): number | null {
  return getTokenExpiration(token);
}

function signatureFor(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("base64url");
}

export function createSessionCookieValue(token: string): string | null {
  const secret = sessionSecret();
  if (!secret || !getTokenExpiration(token)) return null;

  const value = `${token}~${signatureFor(token, secret)}`;
  return value.length <= MAX_COOKIE_LENGTH ? value : null;
}

export function isValidSessionCookie(value: string | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !value || value.length > MAX_COOKIE_LENGTH) return false;

  const separator = value.lastIndexOf("~");
  if (separator <= 0) return false;

  const token = value.slice(0, separator);
  const providedSignature = value.slice(separator + 1);
  if (!/^[A-Za-z0-9_-]{43}$/.test(providedSignature)) return false;

  const expectedSignature = signatureFor(token, secret);
  const providedBuffer = Buffer.from(providedSignature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  return getTokenExpiration(token) !== null;
}

export function getTokenFromSessionCookie(value: string | undefined): string | null {
  if (!value || !isValidSessionCookie(value)) return null;
  const separator = value.lastIndexOf("~");
  return separator > 0 ? value.slice(0, separator) : null;
}

export function sessionCookieOptions(expiration: number) {
  const now = Math.floor(Date.now() / 1000);

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: new Date(expiration * 1000),
    maxAge: Math.max(0, expiration - now),
  };
}

export function expiredSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  };
}
