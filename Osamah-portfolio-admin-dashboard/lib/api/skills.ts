import { createCrudRecord, deleteCrudRecord, listCrudRecords, updateCrudRecord } from "@/lib/api/crud-client";
export { CrudApiError as SkillApiError } from "@/lib/api/crud-client";

export type SkillCategory = { id: number; name: string; display_order: number };

export type Skill = {
  id: number;
  name: string;
  category_id: number;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SkillCategoryInput = { name: string; display_order: number };
export type SkillInput = { name: string; category_id: number; icon: string | null; display_order: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

export function isSkillCategoryResponse(value: unknown): value is SkillCategory {
  return isRecord(value) && typeof value.id === "number" && typeof value.name === "string" && typeof value.display_order === "number";
}

export function isSkillResponse(value: unknown): value is Skill {
  return isRecord(value) && typeof value.id === "number" && typeof value.name === "string" && typeof value.category_id === "number" &&
    nullableString(value.icon) && typeof value.display_order === "number" && typeof value.created_at === "string" && typeof value.updated_at === "string";
}

export function listSkillCategories() { return listCrudRecords("/api/admin/skill-categories", isSkillCategoryResponse); }
export function createSkillCategory(input: SkillCategoryInput) { return createCrudRecord("/api/admin/skill-categories", input, isSkillCategoryResponse); }
export function updateSkillCategory(id: number, input: SkillCategoryInput) { return updateCrudRecord("/api/admin/skill-categories", id, input, isSkillCategoryResponse); }
export function deleteSkillCategory(id: number) { return deleteCrudRecord("/api/admin/skill-categories", id); }

export function listSkills() { return listCrudRecords("/api/admin/skills", isSkillResponse); }
export function createSkill(input: SkillInput) { return createCrudRecord("/api/admin/skills", input, isSkillResponse); }
export function updateSkill(id: number, input: SkillInput) { return updateCrudRecord("/api/admin/skills", id, input, isSkillResponse); }
export function deleteSkill(id: number) { return deleteCrudRecord("/api/admin/skills", id); }
