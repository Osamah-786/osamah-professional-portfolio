import { apiGet } from "@/lib/api/client";
import type { Experience } from "@/types/api";

export function getExperience(): Promise<Experience[]> {
  return apiGet<Experience[]>("/api/experience", "array");
}

export function getFeaturedExperience(): Promise<Experience[]> {
  return apiGet<Experience[]>("/api/experience/featured", "array");
}

export function getExperienceById(id: number): Promise<Experience> {
  return apiGet<Experience>(`/api/experience/${encodeURIComponent(id)}`, "object");
}
