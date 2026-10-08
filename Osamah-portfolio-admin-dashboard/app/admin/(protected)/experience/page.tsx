import type { Metadata } from "next";
import { ExperienceManager } from "@/components/admin/experience/experience-manager";
import { isExperienceResponse, type Experience } from "@/lib/api/experience";
import { callProjectsBackend } from "@/lib/api/projects-server";

export const metadata: Metadata = { title: "Experience" };

export default async function ExperienceAdminPage() {
  let initialExperience: Experience[] | null = null;
  const result = await callProjectsBackend("/api/experience", "GET");
  if (result.status >= 200 && result.status < 300 && Array.isArray(result.body) && result.body.every(isExperienceResponse)) initialExperience = result.body;
  return <ExperienceManager initialExperience={initialExperience} />;
}
