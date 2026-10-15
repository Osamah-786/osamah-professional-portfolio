import { callProjectsBackend } from "@/lib/api/projects-server";

export const listSections = () => callProjectsBackend("/api/admin/sections", "GET");
export type SectionBlock = { type: string; title?: string | null; text?: string | null; items?: string[] | null };
