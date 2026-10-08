import { Achievements } from "@/components/home/Achievements";
import { ContactCTA } from "@/components/home/ContactCTA";
import { Experience } from "@/components/home/Experience";
import { FeaturedCertificates } from "@/components/home/FeaturedCertificates";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { Skills } from "@/components/home/Skills";
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
  const [profileResult, projectsResult, experienceResult, categoriesResult, skillsResult, certificatesResult, achievementsResult, socialLinksResult] = await Promise.all([
    loadHomeSection<Profile>("profile", getProfile),
    loadHomeSection<Project[]>("featured projects", getFeaturedProjects),
    loadHomeSection<ExperienceRecord[]>("experience", getExperience),
    loadHomeSection<SkillCategory[]>("skill categories", getSkillCategories),
    loadHomeSection<Skill[]>("skills", getSkills),
    loadHomeSection<Certificate[]>("featured certificates", getFeaturedCertificates),
    loadHomeSection<Achievement[]>("achievements", getAchievements),
    loadHomeSection<SocialLink[]>("social links", getSocialLinks),
  ]);

  const profile = profileResult.data;
  const socialLinks = socialLinksResult.data ?? [];

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
        <Hero
          profile={profile}
          profileUnavailable={profileResult.failed}
          socialLinks={socialLinks}
        />
        <FeaturedProjects
          projects={projectsResult.data ?? []}
          unavailable={projectsResult.failed}
        />
        <Experience
          experiences={experienceResult.data ?? []}
          unavailable={experienceResult.failed}
        />
        <Skills
          categories={categoriesResult.data ?? []}
          skills={skillsResult.data ?? []}
          unavailable={categoriesResult.failed || skillsResult.failed}
        />
        {!certificatesResult.failed ? (
          <FeaturedCertificates certificates={certificatesResult.data ?? []} />
        ) : null}
        {!achievementsResult.failed ? (
          <Achievements achievements={achievementsResult.data ?? []} />
        ) : null}
        <ContactCTA email={profile?.email ?? null} socialLinks={socialLinks} />
      </main>

      <PortfolioFooter name={profile?.name ?? null} socialLinks={socialLinks} />
    </>
  );
}
