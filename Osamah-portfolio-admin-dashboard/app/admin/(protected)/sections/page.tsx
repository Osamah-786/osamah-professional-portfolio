import type { Metadata } from "next";
import { SectionManager } from "@/components/admin/sections/section-manager";
import { callProjectsBackend } from "@/lib/api/projects-server";
export const metadata: Metadata = { title: "Sections" };
export const dynamic = "force-dynamic";
export default async function SectionsPage() {
  const result = await callProjectsBackend("/api/admin/sections", "GET");
  const sections = result.status >= 200 && result.status < 300 && Array.isArray(result.body) ? result.body : null;
  return <SectionManager initialSections={sections} />;
}
