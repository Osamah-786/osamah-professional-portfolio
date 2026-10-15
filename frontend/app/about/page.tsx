import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import type { Metadata } from "next";
import { Achievements } from "@/components/home/Achievements";
import { Experience } from "@/components/home/Experience";
import { Skills } from "@/components/home/Skills";
import { SocialLinks } from "@/components/home/SocialLinks";
import { PortfolioFooter } from "@/components/layout/PortfolioFooter";
import { Navbar } from "@/components/layout/Navbar";
import { publicNavigationLinks } from "@/components/layout/public-navigation";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError } from "@/lib/api/client";
import { getAchievements } from "@/lib/api/achievements";
import { getCertificates } from "@/lib/api/certificates";
import { getExperience } from "@/lib/api/experience";
import { getProfile } from "@/lib/api/profile";
import { getProjects } from "@/lib/api/projects";
import { getSkills, getSkillCategories } from "@/lib/api/skills";
import { getSocialLinks } from "@/lib/api/social-links";
import type {
  Achievement,
  Certificate,
  Experience as ExperienceRecord,
  Profile,
  Project,
  Skill,
  SkillCategory,
  SocialLink,
} from "@/types/api";

export const metadata: Metadata = {
  title: "About",
  description: "Professional profile, work experience, projects, skills, and achievements.",
};

type SectionResult<T> = {
  data: T | null;
  failed: boolean;
};

async function loadSection<T>(
  name: string,
  request: () => Promise<T>,
): Promise<SectionResult<T>> {
  try {
    return { data: await request(), failed: false };
  } catch (error) {
    const reason = error instanceof ApiError
      ? `${error.kind}${error.statusCode ? ` ${error.statusCode}` : ""}`
      : "unexpected error";
    console.error(`[about] ${name} request failed (${reason}).`);
    return { data: null, failed: true };
  }
}

function formatMonthYear(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AboutPage() {
  const [
    profileResult,
    experienceResult,
    projectsResult,
    categoriesResult,
    skillsResult,
    certificatesResult,
    achievementsResult,
    socialLinksResult,
  ] = await Promise.all([
    loadSection<Profile>("profile", getProfile),
    loadSection<ExperienceRecord[]>("experience", getExperience),
    loadSection<Project[]>("projects", getProjects),
    loadSection<SkillCategory[]>("skill categories", getSkillCategories),
    loadSection<Skill[]>("skills", getSkills),
    loadSection<Certificate[]>("certificates", getCertificates),
    loadSection<Achievement[]>("achievements", getAchievements),
    loadSection<SocialLink[]>("social links", getSocialLinks),
  ]);

  const profile = profileResult.data;
  const experiences = experienceResult.data ?? [];
  const projects = projectsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const skills = skillsResult.data ?? [];
  const certificates = certificatesResult.data ?? [];
  const achievements = achievementsResult.data ?? [];
  const socialLinks = socialLinksResult.data ?? [];
  const hasFailures = [
    profileResult,
    experienceResult,
    projectsResult,
    categoriesResult,
    skillsResult,
    certificatesResult,
    achievementsResult,
    socialLinksResult,
  ].some((result) => result.failed);

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
        <Section aria-labelledby="about-title">
          <Container>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to portfolio
            </Link>

            <Reveal>
              <SectionHeading
                id="about-title"
                as="h1"
                eyebrow="PROFILE"
                title={profile?.name ?? "About"}
                description={profile?.headline ?? undefined}
                className="mt-10 lg:mt-14"
              />
            </Reveal>

            {hasFailures ? (
              <p role="status" className="mt-8 border-t border-border pt-5 text-sm text-ink-muted">
                Some portfolio information is temporarily unavailable. Please try again later.
              </p>
            ) : null}

            {profile?.full_bio ? (
              <article className="mt-12 border-t border-border pt-7">
                <h2 className="text-xl font-medium tracking-tight sm:text-2xl">About me</h2>
                <div className="mt-5 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
                  {profile.profile_image ? (
                    <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden border border-border bg-surface md:mx-0">
                      <Image
                        src={profile.profile_image}
                        alt={`Portrait of ${profile.name}`}
                        fill
                        sizes="(max-width: 767px) min(90vw, 24rem), 32vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <p className="whitespace-pre-line text-base leading-7 text-ink-secondary sm:text-lg sm:leading-8">
                      {profile.full_bio}
                    </p>
                    {profile.location ? (
                      <p className="mt-6 font-mono text-xs tracking-[0.06em] text-ink-muted">
                        {profile.location}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ) : null}
          </Container>
        </Section>

        {experiences.length > 0 ? <Experience experiences={experiences} /> : null}

        {projects.length > 0 ? (
          <Section id="about-projects" aria-labelledby="about-projects-title" className="border-t border-border">
            <Container>
              <Reveal>
                <SectionHeading
                  id="about-projects-title"
                  eyebrow="PORTFOLIO / PROJECTS"
                  title="Selected work."
                  description="Project summaries and links to the full project records."
                />
                <ol className="mt-9 grid gap-x-10 md:grid-cols-2">
                  {projects.map((project, index) => {
                    const summary = project.short_description || project.description;
                    return (
                      <li key={project.id} className="border-t border-border py-5">
                        <p className="font-mono text-xs text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-2 break-words text-lg font-medium tracking-tight sm:text-xl">
                          <Link
                            href={`/projects/${encodeURIComponent(project.slug)}`}
                            className="text-ink no-underline hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                          >
                            {project.title}
                          </Link>
                        </h3>
                        {summary ? (
                          <p className="mt-2 text-sm leading-6 text-ink-muted">{summary}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                          <Link
                            href={`/projects/${encodeURIComponent(project.slug)}`}
                            className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                          >
                            Project details <ArrowUpRight size={14} aria-hidden="true" />
                          </Link>
                          {project.live_url ? (
                            <a
                              href={project.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                            >
                              Live project <ArrowUpRight size={14} aria-hidden="true" />
                            </a>
                          ) : null}
                          {project.github_url ? (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                            >
                              Source code <ArrowUpRight size={14} aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Reveal>
            </Container>
          </Section>
        ) : null}

        {skills.length > 0 && categories.length > 0 ? (
          <Skills categories={categories} skills={skills} />
        ) : null}

        {certificates.length > 0 ? (
          <Section id="about-certificates" aria-labelledby="about-certificates-title" className="border-t border-border">
            <Container>
              <Reveal>
                <SectionHeading
                  id="about-certificates-title"
                  eyebrow="PORTFOLIO / CREDENTIALS"
                  title="Certificates."
                  description="Credentials and verification links available in the portfolio."
                />
                <ul className="mt-9">
                  {certificates.map((certificate) => {
                    const issueDate = formatMonthYear(certificate.issue_date);
                    return (
                      <li key={certificate.id} className="border-t border-border py-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="break-words text-base font-medium sm:text-lg">{certificate.title}</h3>
                            {certificate.issuer ? (
                              <p className="mt-1 text-sm text-ink-muted">{certificate.issuer}</p>
                            ) : null}
                            {certificate.description ? (
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{certificate.description}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
                            {issueDate ? (
                              <span className="font-mono text-xs text-ink-muted">{issueDate}</span>
                            ) : null}
                            {certificate.credential_url ? (
                              <a
                                href={certificate.credential_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                              >
                                Verify <ArrowUpRight size={14} aria-hidden="true" />
                              </a>
                            ) : null}
                            {certificate.certificate_file ? (
                              <a
                                href={certificate.certificate_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                              >
                                <FileText size={14} aria-hidden="true" /> File
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 flex justify-end">
                  <Link
                    href="/certificates"
                    className="inline-flex min-h-11 items-center text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    Browse certificate archive
                  </Link>
                </div>
              </Reveal>
            </Container>
          </Section>
        ) : null}

        {achievements.length > 0 ? <Achievements achievements={achievements} /> : null}

        {socialLinks.length > 0 ? (
          <Section id="about-social-links" aria-labelledby="about-social-links-title" className="border-t border-border">
            <Container>
              <Reveal>
                <SectionHeading
                  id="about-social-links-title"
                  eyebrow="ELSEWHERE"
                  title="Social and professional links."
                  description="Configured destinations for professional profiles and other public links."
                />
                <SocialLinks links={socialLinks} className="mt-7" />
              </Reveal>
            </Container>
          </Section>
        ) : null}
      </main>

      <PortfolioFooter name={profile?.name ?? null} socialLinks={socialLinks} />
    </>
  );
}
