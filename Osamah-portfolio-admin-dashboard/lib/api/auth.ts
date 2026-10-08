export type LoginCredentials = {
  username: string;
  password: string;
};

type LoginSuccess = { authenticated: true };
type LogoutSuccess = { loggedOut: true };
type AuthErrorCode = "invalid_credentials" | "unavailable";

export class AuthClientError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthClientError";
  }
}

async function postAuthRequest<T>(endpoint: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new AuthClientError("unavailable");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AuthClientError("unavailable");
  }

  if (!response.ok) {
    const code =
      typeof payload === "object" && payload !== null && Reflect.get(payload, "code") === "invalid_credentials"
        ? "invalid_credentials"
        : "unavailable";
    throw new AuthClientError(code);
  }

  if (typeof payload !== "object" || payload === null) {
    throw new AuthClientError("unavailable");
  }

  return payload as T;
}

export async function loginAdmin(credentials: LoginCredentials): Promise<LoginSuccess> {
  const result = await postAuthRequest<LoginSuccess>("/api/auth/login", credentials);
  if (result.authenticated !== true) throw new AuthClientError("unavailable");
  return result;
}

export async function logoutAdmin(): Promise<LogoutSuccess> {
  const result = await postAuthRequest<LogoutSuccess>("/api/auth/logout");
  if (result.loggedOut !== true) throw new AuthClientError("unavailable");
  return result;
}
