import { apiGet } from "@/lib/api/client";
import type { Project } from "@/types/api";

export function getProjects(): Promise<Project[]> {
  return apiGet<Project[]>("/api/projects", "array");
}

export function getFeaturedProjects(): Promise<Project[]> {
  return apiGet<Project[]>("/api/projects/featured", "array");
}

export function getProjectBySlug(slug: string): Promise<Project> {
  return apiGet<Project>(`/api/projects/${encodeURIComponent(slug)}`, "object");
}
