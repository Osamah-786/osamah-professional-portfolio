export type Project = {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image: string | null;
  github_url: string | null;
  live_url: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image: string | null;
  github_url: string | null;
  live_url: string | null;
  featured: boolean;
  display_order: number;
};

export type ProjectApiErrorCode = "unavailable" | "not_found" | "slug_conflict" | "validation" | "invalid_response";

export class ProjectApiError extends Error {
  constructor(readonly code: ProjectApiErrorCode) {
    super(code);
    this.name = "ProjectApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isProjectResponse(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.slug === "string" &&
    (typeof value.short_description === "string" || value.short_description === null) &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.cover_image === "string" || value.cover_image === null) &&
    (typeof value.github_url === "string" || value.github_url === null) &&
    (typeof value.live_url === "string" || value.live_url === null) &&
    typeof value.featured === "boolean" &&
    typeof value.display_order === "number" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

async function request<T>(method: "GET" | "POST" | "PUT" | "DELETE", body?: ProjectInput, id?: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(id === undefined ? "/api/admin/projects" : `/api/admin/projects/${id}`, {
      method,
      headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ProjectApiError("unavailable");
  }

  if (!response.ok) {
    if (response.status === 404) throw new ProjectApiError("not_found");
    if (response.status === 409) throw new ProjectApiError("slug_conflict");
    if (response.status === 400 || response.status === 422) throw new ProjectApiError("validation");
    throw new ProjectApiError("unavailable");
  }
  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ProjectApiError("invalid_response");
  }
}

export async function listProjects(): Promise<Project[]> {
  const payload = await request<unknown[]>("GET");
  if (!Array.isArray(payload) || !payload.every(isProjectResponse)) throw new ProjectApiError("invalid_response");
  return payload;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const payload = await request<unknown>("POST", input);
  if (!isProjectResponse(payload)) throw new ProjectApiError("invalid_response");
  return payload;
}

export async function updateProject(id: number, input: ProjectInput): Promise<Project> {
  const payload = await request<unknown>("PUT", input, id);
  if (!isProjectResponse(payload)) throw new ProjectApiError("invalid_response");
  return payload;
}

export async function deleteProject(id: number): Promise<void> {
  await request<void>("DELETE", undefined, id);
}
