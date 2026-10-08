import type { Metadata } from "next";
import { DashboardOverview, type DashboardOverviewData } from "@/components/admin/dashboard-overview";
import {
  getDashboardAchievements,
  getDashboardCertificates,
  getDashboardExperience,
  getDashboardMedia,
  getDashboardProjects,
  getDashboardSkillCategories,
  getDashboardSkills,
  getDashboardSocialLinks,
} from "@/lib/api/dashboard";

export const metadata: Metadata = { title: "Overview" };

async function loadSection<T>(request: () => Promise<T[]>) {
  try {
    return { data: await request(), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export default async function AdminOverviewPage() {
  const [projects, experience, certificates, skillCategories, skills, achievements, socialLinks, media] =
    await Promise.all([
      loadSection(getDashboardProjects),
      loadSection(getDashboardExperience),
      loadSection(getDashboardCertificates),
      loadSection(getDashboardSkillCategories),
      loadSection(getDashboardSkills),
      loadSection(getDashboardAchievements),
      loadSection(getDashboardSocialLinks),
      loadSection(getDashboardMedia),
    ]);

  const data: DashboardOverviewData = {
    projects,
    experience,
    certificates,
    skillCategories,
    skills,
    achievements,
    socialLinks,
    media,
  };

  return (
    <>
      <header className="mb-8 flex flex-col gap-5 border-b border-border pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.09em] text-accent">ADMIN / OVERVIEW</p>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl">Portfolio workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">A live summary of the content in your portfolio CMS.</p>
        </div>
      </header>
      <DashboardOverview data={data} />
    </>
  );
}
