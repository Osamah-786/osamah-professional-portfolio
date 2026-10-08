import { createCrudRecord, deleteCrudRecord, listCrudRecords, updateCrudRecord } from "@/lib/api/crud-client";
export { CrudApiError as SocialLinkApiError } from "@/lib/api/crud-client";

export type SocialLink = {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SocialLinkInput = Omit<SocialLink, "id" | "created_at" | "updated_at">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSocialLinkResponse(value: unknown): value is SocialLink {
  return isRecord(value) && typeof value.id === "number" && typeof value.platform === "string" && typeof value.url === "string" &&
    (typeof value.icon === "string" || value.icon === null) && typeof value.display_order === "number" &&
    typeof value.created_at === "string" && typeof value.updated_at === "string";
}

export function listSocialLinks() { return listCrudRecords("/api/admin/social-links", isSocialLinkResponse); }
export function createSocialLink(input: SocialLinkInput) { return createCrudRecord("/api/admin/social-links", input, isSocialLinkResponse); }
export function updateSocialLink(id: number, input: SocialLinkInput) { return updateCrudRecord("/api/admin/social-links", id, input, isSocialLinkResponse); }
export function deleteSocialLink(id: number) { return deleteCrudRecord("/api/admin/social-links", id); }
