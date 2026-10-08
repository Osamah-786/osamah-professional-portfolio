import type { Metadata } from "next";
import { ProjectsManager } from "@/components/admin/projects/projects-manager";
import { isProjectResponse, type Project } from "@/lib/api/projects";
import { callProjectsBackend } from "@/lib/api/projects-server";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsAdminPage() {
  let initialProjects: Project[] | null = null;
  const result = await callProjectsBackend("/api/projects", "GET");
  if (result.status >= 200 && result.status < 300 && Array.isArray(result.body) && result.body.every(isProjectResponse)) {
    initialProjects = result.body;
  }

  return <ProjectsManager initialProjects={initialProjects} />;
}
