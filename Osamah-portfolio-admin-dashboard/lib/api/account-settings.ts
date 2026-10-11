export type AccountSettingsErrorCode =
  | "invalid_current_password"
  | "username_taken"
  | "validation"
  | "unauthorized"
  | "unavailable";

export class AccountSettingsError extends Error {
  constructor(readonly code: AccountSettingsErrorCode) {
    super(code);
    this.name = "AccountSettingsError";
  }
}

async function updateAccount(endpoint: string, body: Record<string, string>): Promise<void> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new AccountSettingsError("unavailable");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AccountSettingsError("unavailable");
  }
  if (!response.ok) {
    const code = typeof payload === "object" && payload !== null ? Reflect.get(payload, "code") : null;
    if (
      code === "invalid_current_password" || code === "username_taken" || code === "validation" ||
      code === "unauthorized" || code === "unavailable"
    ) throw new AccountSettingsError(code);
    throw new AccountSettingsError("unavailable");
  }
  if (typeof payload !== "object" || payload === null || Reflect.get(payload, "updated") !== true) {
    throw new AccountSettingsError("unavailable");
  }
}

export function changeAdminUsername(input: {
  current_password: string;
  new_username: string;
  confirm_new_username: string;
}) {
  return updateAccount("/api/auth/username", input);
}

export function changeAdminPassword(input: {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}) {
  return updateAccount("/api/auth/password", input);
}
