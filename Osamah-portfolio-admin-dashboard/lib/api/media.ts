import { createCrudRecord, deleteCrudRecord, listCrudRecords } from "@/lib/api/crud-client";
export { CrudApiError as MediaApiError } from "@/lib/api/crud-client";

export type Media = {
  id: number;
  file_url: string;
  public_id: string | null;
  file_type: string;
  alt_text: string | null;
  created_at: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMediaResponse(value: unknown): value is Media {
  return isRecord(value) && typeof value.id === "number" && typeof value.file_url === "string" &&
    (typeof value.public_id === "string" || value.public_id === null) && typeof value.file_type === "string" &&
    (typeof value.alt_text === "string" || value.alt_text === null) && typeof value.created_at === "string" &&
    typeof value.updated_at === "string";
}

export function listMedia() {
  return listCrudRecords("/api/admin/media", isMediaResponse);
}

export function uploadMedia(file: File, altText: string): Promise<Media> {
  const form = new FormData();
  form.append("file", file, file.name);
  if (altText.trim()) form.append("alt_text", altText.trim());
  return createCrudRecord("/api/admin/media/upload", form, isMediaResponse);
}

export function deleteMedia(id: number) {
  return deleteCrudRecord("/api/admin/media", id);
}
