import { Achievements } from "@/components/home/Achievements";
import { ContactCTA } from "@/components/home/ContactCTA";
import { Experience } from "@/components/home/Experience";
import { FeaturedCertificates } from "@/components/home/FeaturedCertificates";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { Skills } from "@/components/home/Skills";
import { SocialLinks } from "@/components/home/SocialLinks";
import { PortfolioFooter } from "@/components/layout/PortfolioFooter";
import { Navbar } from "@/components/layout/Navbar";
import { publicNavigationLinks } from "@/components/layout/public-navigation";
import { ApiError } from "@/lib/api/client";
import { getAchievements } from "@/lib/api/achievements";
import { getFeaturedCertificates } from "@/lib/api/certificates";
import { getExperience } from "@/lib/api/experience";
import { getProfile } from "@/lib/api/profile";
import { getFeaturedProjects } from "@/lib/api/projects";
import { getSkills, getSkillCategories } from "@/lib/api/skills";
import { getSocialLinks } from "@/lib/api/social-links";
import { getPublicSections, type PortfolioSection } from "@/lib/api/sections";
import { CustomSectionContent } from "@/components/sections/CustomSectionContent";
import type { Achievement, Certificate, Experience as ExperienceRecord, Profile, Project, Skill, SkillCategory, SocialLink } from "@/types/api";

type RequestResult<T> = {
  data: T | null;
  failed: boolean;
};

async function loadHomeSection<T>(
  section: string,
  request: () => Promise<T>,
): Promise<RequestResult<T>> {
  try {
    return { data: await request(), failed: false };
  } catch (error) {
    const reason = error instanceof ApiError
      ? `${error.kind}${error.statusCode ? ` ${error.statusCode}` : ""}`
      : "unexpected error";
    console.error(`[home] ${section} request failed (${reason}).`);
    return { data: null, failed: true };
  }
}

export default async function HomePage() {
  const [profileResult, projectsResult, experienceResult, categoriesResult, skillsResult, certificatesResult, achievementsResult, socialLinksResult, sectionsResult] = await Promise.all([
    loadHomeSection<Profile>("profile", getProfile),
    loadHomeSection<Project[]>("featured projects", getFeaturedProjects),
    loadHomeSection<ExperienceRecord[]>("experience", getExperience),
    loadHomeSection<SkillCategory[]>("skill categories", getSkillCategories),
    loadHomeSection<Skill[]>("skills", getSkills),
    loadHomeSection<Certificate[]>("featured certificates", getFeaturedCertificates),
    loadHomeSection<Achievement[]>("achievements", getAchievements),
    loadHomeSection<SocialLink[]>("social links", getSocialLinks),
    loadHomeSection<PortfolioSection[]>("section registry", getPublicSections),
  ]);

  const profile = profileResult.data;
  const socialLinks = socialLinksResult.data ?? [];
  const sections = sectionsResult.data;

  function renderSection(section: PortfolioSection) {
    if (section.section_type === "custom") return <section key={section.id} id={section.slug} className="border-t border-border py-16 sm:py-20"><div className="mx-auto max-w-5xl px-5 sm:px-8"><p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">PORTFOLIO / CUSTOM SECTION</p><h2 className="mt-4 text-3xl font-medium tracking-tight text-ink sm:text-5xl">{section.title}</h2>{section.short_description ? <p className="mt-4 max-w-3xl text-base leading-7 text-ink-muted">{section.short_description}</p> : null}{section.cover_image ? <div className="relative mt-8 aspect-video overflow-hidden border border-border bg-surface-raised"><Image src={section.cover_image} alt={section.cover_image_alt ?? ""} fill unoptimized sizes="(max-width: 768px) 100vw, 80vw" className="object-contain" /></div> : null}<div className="mt-8"><CustomSectionContent blocks={section.content_blocks} fields={section.custom_fields} values={section.custom_field_values} /></div>{section.read_more_enabled ? <a className="mt-6 inline-block text-sm text-accent underline underline-offset-4" href={`/sections/${section.slug}`}>Read more</a> : null}</div></section>;
    switch (section.key) {
      case "profile": return <Hero key={section.id} profile={profile} profileUnavailable={profileResult.failed} socialLinks={socialLinks} />;
      case "projects": return <FeaturedProjects key={section.id} projects={projectsResult.data ?? []} unavailable={projectsResult.failed} />;
      case "experience": return <Experience key={section.id} experiences={experienceResult.data ?? []} unavailable={experienceResult.failed} />;
      case "skills": return <Skills key={section.id} categories={categoriesResult.data ?? []} skills={skillsResult.data ?? []} unavailable={categoriesResult.failed || skillsResult.failed} />;
      case "certificates": return certificatesResult.failed ? null : <FeaturedCertificates key={section.id} certificates={certificatesResult.data ?? []} />;
      case "achievements": return achievementsResult.failed ? null : <Achievements key={section.id} achievements={achievementsResult.data ?? []} />;
      case "social_links": return <section key={section.id} className="border-t border-border py-12"><div className="mx-auto max-w-5xl px-5 sm:px-8"><h2 className="text-2xl font-medium text-ink">{section.title}</h2><SocialLinks links={socialLinks} /></div></section>;
      case "contact": return <ContactCTA key={section.id} email={profile?.email ?? null} socialLinks={socialLinks} />;
      default: return null;
    }
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:bg-surface-raised focus:px-4 focus:py-3 focus:text-ink"
      >
        Skip to content
      </a>

      <Navbar brand="PORTFOLIO" links={publicNavigationLinks} />

      <main id="main-content">
        {sections ? sections.map(renderSection) : <>
          <Hero profile={profile} profileUnavailable={profileResult.failed} socialLinks={socialLinks} />
          <FeaturedProjects projects={projectsResult.data ?? []} unavailable={projectsResult.failed} />
          <Experience experiences={experienceResult.data ?? []} unavailable={experienceResult.failed} />
          <Skills categories={categoriesResult.data ?? []} skills={skillsResult.data ?? []} unavailable={categoriesResult.failed || skillsResult.failed} />
          {!certificatesResult.failed ? <FeaturedCertificates certificates={certificatesResult.data ?? []} /> : null}
          {!achievementsResult.failed ? <Achievements achievements={achievementsResult.data ?? []} /> : null}
          <ContactCTA email={profile?.email ?? null} socialLinks={socialLinks} />
        </>}
      </main>

      <PortfolioFooter name={profile?.name ?? null} socialLinks={socialLinks} />
    </>
  );
}
import Image from "next/image";
