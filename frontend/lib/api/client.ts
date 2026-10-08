export type ApiErrorKind = "configuration" | "network" | "http" | "invalid-response";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly statusCode?: number,
    readonly endpoint?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ResponseShape = "array" | "object";

function buildApiUrl(endpoint: string): URL {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!baseUrl) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL is not configured.",
      "configuration",
      undefined,
      endpoint,
    );
  }

  let url: URL;
  try {
    url = new URL(`${baseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`);
  } catch {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL must be a valid absolute URL.",
      "configuration",
      undefined,
      endpoint,
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL must use HTTP or HTTPS and must not contain credentials.",
      "configuration",
      undefined,
      endpoint,
    );
  }

  return url;
}

export async function apiGet<T>(
  endpoint: string,
  expectedShape: ResponseShape,
): Promise<T> {
  const url = buildApiUrl(endpoint);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Unable to reach the portfolio API.",
      "network",
      undefined,
      endpoint,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Portfolio API request failed with HTTP ${response.status}.`,
      "http",
      response.status,
      endpoint,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      "Portfolio API returned invalid JSON.",
      "invalid-response",
      response.status,
      endpoint,
    );
  }

  const isObject = typeof payload === "object" && payload !== null && !Array.isArray(payload);
  if ((expectedShape === "array" && !Array.isArray(payload)) || (expectedShape === "object" && !isObject)) {
    throw new ApiError(
      `Portfolio API returned an unexpected response shape; expected ${expectedShape}.`,
      "invalid-response",
      response.status,
      endpoint,
    );
  }

  return payload as T;
}
