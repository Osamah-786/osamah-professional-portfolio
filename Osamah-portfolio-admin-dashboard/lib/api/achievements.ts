import { createCrudRecord, deleteCrudRecord, listCrudRecords, updateCrudRecord } from "@/lib/api/crud-client";
export { CrudApiError as AchievementApiError } from "@/lib/api/crud-client";

export type Achievement = {
  id: number;
  title: string;
  short_description: string | null;
  description: string | null;
  image: string | null;
  link: string | null;
  date: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type AchievementInput = Omit<Achievement, "id" | "created_at" | "updated_at">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

export function isAchievementResponse(value: unknown): value is Achievement {
  return isRecord(value) && typeof value.id === "number" && typeof value.title === "string" &&
    nullableString(value.short_description) && nullableString(value.description) && nullableString(value.image) &&
    nullableString(value.link) && nullableString(value.date) && typeof value.featured === "boolean" &&
    typeof value.display_order === "number" && typeof value.created_at === "string" && typeof value.updated_at === "string";
}

export function listAchievements() { return listCrudRecords("/api/admin/achievements", isAchievementResponse); }
export function createAchievement(input: AchievementInput) { return createCrudRecord("/api/admin/achievements", input, isAchievementResponse); }
export function updateAchievement(id: number, input: AchievementInput) { return updateCrudRecord("/api/admin/achievements", id, input, isAchievementResponse); }
export function deleteAchievement(id: number) { return deleteCrudRecord("/api/admin/achievements", id); }
