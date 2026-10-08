import { apiGet } from "@/lib/api/client";
import type { Achievement } from "@/types/api";

export function getAchievements(): Promise<Achievement[]> {
  return apiGet<Achievement[]>("/api/achievements", "array");
}

export function getFeaturedAchievements(): Promise<Achievement[]> {
  return apiGet<Achievement[]>("/api/achievements/featured", "array");
}

export function getAchievementById(id: number): Promise<Achievement> {
  return apiGet<Achievement>(`/api/achievements/${encodeURIComponent(id)}`, "object");
}
