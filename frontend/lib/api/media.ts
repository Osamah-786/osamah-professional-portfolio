import { apiGet } from "@/lib/api/client";
import type { Media } from "@/types/api";

export function getMediaById(id: number): Promise<Media> {
  return apiGet<Media>(`/api/media/${encodeURIComponent(id)}`, "object");
}
