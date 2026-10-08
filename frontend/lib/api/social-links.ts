import { apiGet } from "@/lib/api/client";
import type { SocialLink } from "@/types/api";

export function getSocialLinks(): Promise<SocialLink[]> {
  return apiGet<SocialLink[]>("/api/social-links", "array");
}

export function getSocialLinkById(id: number): Promise<SocialLink> {
  return apiGet<SocialLink>(`/api/social-links/${encodeURIComponent(id)}`, "object");
}
