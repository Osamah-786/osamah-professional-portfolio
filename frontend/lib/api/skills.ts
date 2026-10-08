import { apiGet } from "@/lib/api/client";
import type { Skill, SkillCategory } from "@/types/api";

export function getSkillCategories(): Promise<SkillCategory[]> {
  return apiGet<SkillCategory[]>("/api/skill-categories", "array");
}

export function getSkillCategoryById(id: number): Promise<SkillCategory> {
  return apiGet<SkillCategory>(`/api/skill-categories/${encodeURIComponent(id)}`, "object");
}

export function getSkillsByCategory(categoryId: number): Promise<Skill[]> {
  return apiGet<Skill[]>(
    `/api/skill-categories/${encodeURIComponent(categoryId)}/skills`,
    "array",
  );
}

export function getSkills(): Promise<Skill[]> {
  return apiGet<Skill[]>("/api/skills", "array");
}

export function getSkillById(id: number): Promise<Skill> {
  return apiGet<Skill>(`/api/skills/${encodeURIComponent(id)}`, "object");
}
