export type CrudErrorCode = "unavailable" | "unauthorized" | "not_found" | "conflict" | "validation" | "invalid_response";

export class CrudApiError extends Error {
  constructor(readonly code: CrudErrorCode) {
    super(code);
    this.name = "CrudApiError";
  }
}

async function request<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  let response: Response;
  try {
    const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = new Headers({ Accept: "application/json" });
    if (body !== undefined && !isMultipart) headers.set("Content-Type", "application/json");
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : isMultipart ? body : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new CrudApiError("unavailable");
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new CrudApiError("unauthorized");
    if (response.status === 404) throw new CrudApiError("not_found");
    if (response.status === 409) throw new CrudApiError("conflict");
    if (response.status === 400 || response.status === 413 || response.status === 422) throw new CrudApiError("validation");
    throw new CrudApiError("unavailable");
  }
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new CrudApiError("invalid_response");
  }
}

export async function listCrudRecords<T>(path: string, isItem: (value: unknown) => value is T): Promise<T[]> {
  const payload: unknown = await request(path, "GET");
  if (!Array.isArray(payload) || !payload.every(isItem)) throw new CrudApiError("invalid_response");
  return payload;
}

export async function getCrudRecord<T>(path: string, isItem: (value: unknown) => value is T): Promise<T> {
  const payload: unknown = await request(path, "GET");
  if (!isItem(payload)) throw new CrudApiError("invalid_response");
  return payload;
}

export async function replaceCrudRecord<T, I>(path: string, input: I, isItem: (value: unknown) => value is T): Promise<T> {
  const payload: unknown = await request(path, "PUT", input);
  if (!isItem(payload)) throw new CrudApiError("invalid_response");
  return payload;
}

export async function createCrudRecord<T, I>(path: string, input: I, isItem: (value: unknown) => value is T): Promise<T> {
  const payload: unknown = await request(path, "POST", input);
  if (!isItem(payload)) throw new CrudApiError("invalid_response");
  return payload;
}

export async function updateCrudRecord<T, I>(path: string, id: number, input: I, isItem: (value: unknown) => value is T): Promise<T> {
  const payload: unknown = await request(`${path}/${id}`, "PUT", input);
  if (!isItem(payload)) throw new CrudApiError("invalid_response");
  return payload;
}

export async function deleteCrudRecord(path: string, id: number): Promise<void> {
  await request<void>(`${path}/${id}`, "DELETE");
}
