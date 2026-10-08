import { createCrudRecord, deleteCrudRecord, listCrudRecords, updateCrudRecord } from "@/lib/api/crud-client";
export { CrudApiError as ExperienceApiError } from "@/lib/api/crud-client";

export type Experience = {
  id: number;
  company: string;
  role: string;
  company_logo: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  currently_working: boolean;
  short_description: string | null;
  description: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ExperienceInput = Omit<Experience, "id" | "created_at" | "updated_at">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

export function isExperienceResponse(value: unknown): value is Experience {
  return isRecord(value) && typeof value.id === "number" && typeof value.company === "string" && typeof value.role === "string" &&
    nullableString(value.company_logo) && nullableString(value.location) && typeof value.start_date === "string" &&
    nullableString(value.end_date) && typeof value.currently_working === "boolean" && nullableString(value.short_description) &&
    nullableString(value.description) && typeof value.featured === "boolean" && typeof value.display_order === "number" &&
    typeof value.created_at === "string" && typeof value.updated_at === "string";
}

export function listExperience() { return listCrudRecords("/api/admin/experience", isExperienceResponse); }
export function createExperience(input: ExperienceInput) { return createCrudRecord("/api/admin/experience", input, isExperienceResponse); }
export function updateExperience(id: number, input: ExperienceInput) { return updateCrudRecord("/api/admin/experience", id, input, isExperienceResponse); }
export function deleteExperience(id: number) { return deleteCrudRecord("/api/admin/experience", id); }
