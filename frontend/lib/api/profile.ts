import { apiGet } from "@/lib/api/client";
import type { Profile } from "@/types/api";

export function getProfile(): Promise<Profile> {
  return apiGet<Profile>("/api/profile", "object");
}
