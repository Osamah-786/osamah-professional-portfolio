import { getCrudRecord, replaceCrudRecord } from "@/lib/api/crud-client";
export { CrudApiError as ProfileApiError } from "@/lib/api/crud-client";

export type Profile = {
  name: string;
  headline: string | null;
  short_bio: string | null;
  full_bio: string | null;
  profile_image: string | null;
  location: string | null;
  email: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = Omit<Profile, "created_at" | "updated_at">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

export function isProfileResponse(value: unknown): value is Profile {
  return isRecord(value) && typeof value.name === "string" && nullableString(value.headline) && nullableString(value.short_bio) &&
    nullableString(value.full_bio) && nullableString(value.profile_image) && nullableString(value.location) && nullableString(value.email) &&
    nullableString(value.resume_url) && typeof value.created_at === "string" && typeof value.updated_at === "string";
}

export function getProfile() {
  return getCrudRecord("/api/admin/profile", isProfileResponse);
}

export function updateProfile(input: ProfileInput) {
  return replaceCrudRecord("/api/admin/profile", input, isProfileResponse);
}
