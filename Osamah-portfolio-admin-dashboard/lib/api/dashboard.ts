import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getTokenFromSessionCookie } from "@/lib/auth/session";

export type DashboardRecord = {
  id: number;
  created_at?: string;
  featured?: boolean;
  title?: string;
  name?: string;
  company?: string;
  role?: string;
  platform?: string;
  file_url?: string;
  file_type?: string;
};

export type SkillCategory = {
  id: number;
  name: string;
  display_order: number;
};

export type Skill = {
  id: number;
  name: string;
  category_id: number;
  display_order: number;
  created_at: string;
};

export class DashboardApiError extends Error {
  constructor(readonly kind: "configuration" | "network" | "http" | "invalid-response") {
    super(kind);
    this.name = "DashboardApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDashboardRecord(value: unknown): value is DashboardRecord {
  return isRecord(value) && typeof value.id === "number";
}

function isSkillCategory(value: unknown): value is SkillCategory {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.display_order === "number"
  );
}

function isSkill(value: unknown): value is Skill {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.category_id === "number" &&
    typeof value.display_order === "number" &&
    typeof value.created_at === "string"
  );
}

function apiBaseUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) throw new DashboardApiError("configuration");

  try {
    const url = new URL(configured);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    ) {
      throw new DashboardApiError("configuration");
    }
    return url;
  } catch (error) {
    if (error instanceof DashboardApiError) throw error;
    throw new DashboardApiError("configuration");
  }
}

async function getJson(path: string, requiresAdmin = false): Promise<unknown> {
  const url = apiBaseUrl();
  url.pathname = `${url.pathname.replace(/\/$/, "")}${path}`;

  const headers = new Headers({ Accept: "application/json" });
  if (requiresAdmin) {
    const cookieStore = await cookies();
    const token = getTokenFromSessionCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
    if (!token) throw new DashboardApiError("http");
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { headers, cache: "no-store" });
  } catch {
    throw new DashboardApiError("network");
  }
  if (!response.ok) throw new DashboardApiError("http");

  try {
    return await response.json();
  } catch {
    throw new DashboardApiError("invalid-response");
  }
}

async function getList<T>(path: string, isItem: (value: unknown) => value is T, requiresAdmin = false): Promise<T[]> {
  const payload = await getJson(path, requiresAdmin);
  if (!Array.isArray(payload) || !payload.every(isItem)) throw new DashboardApiError("invalid-response");
  return payload;
}

export const getDashboardProjects = () => getList("/api/projects", isDashboardRecord);
export const getDashboardExperience = () => getList("/api/experience", isDashboardRecord);
export const getDashboardCertificates = () => getList("/api/certificates", isDashboardRecord);
export const getDashboardSkillCategories = () => getList("/api/skill-categories", isSkillCategory);
export const getDashboardSkills = () => getList("/api/skills", isSkill);
export const getDashboardAchievements = () => getList("/api/achievements", isDashboardRecord);
export const getDashboardSocialLinks = () => getList("/api/social-links", isDashboardRecord);
export const getDashboardMedia = () => getList("/api/admin/media", isDashboardRecord, true);
