import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PortfolioFooter } from "@/components/layout/PortfolioFooter";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { publicNavigationLinks } from "@/components/layout/public-navigation";
import { ApiError } from "@/lib/api/client";
import { getProjects } from "@/lib/api/projects";
import type { Project } from "@/types/api";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse Osamah’s software engineering project archive.",
};

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let unavailable = false;

  try {
    projects = await getProjects();
  } catch (error) {
    unavailable = true;
    const reason = error instanceof ApiError
      ? `${error.kind}${error.statusCode ? ` ${error.statusCode}` : ""}`
      : "unexpected error";
    console.error(`[projects] archive request failed (${reason}).`);
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
        <Section aria-labelledby="projects-title" className="pb-10 sm:pb-14 lg:pb-16">
          <Container>
            <Reveal>
              <SectionHeading
                id="projects-title"
                as="h1"
                eyebrow="PROJECT ARCHIVE / 2026"
                title="Selected work."
                description="A closer look at systems designed to make complex work clearer, more reliable, and easier to use."
              />
              <p className="mt-8 font-mono text-xs tracking-[0.08em] text-ink-muted">
                {unavailable
                  ? "ARCHIVE UNAVAILABLE"
                  : `${String(projects.length).padStart(2, "0")} PROJECTS`}
              </p>
            </Reveal>
          </Container>
        </Section>

        <Divider />

        <Section aria-label="Project archive" className="py-4 sm:py-8 lg:py-10">
          <Container>
            {projects.length > 0 ? (
              <ol className="m-0 list-none p-0">
                {projects.map((project, index) => {
                  const description = project.short_description ?? project.description;

                  return (
                    <li key={project.id}>
                      <Reveal delay={index * 0.04}>
                        <article className="grid gap-5 py-10 sm:gap-7 sm:py-14 lg:grid-cols-2 lg:gap-10 lg:py-16">
                          <div className="group relative aspect-video overflow-hidden border border-border bg-surface-raised">
                            {project.cover_image ? (
                              <ImageWithFallback
                                src={project.cover_image}
                                alt={`Project preview for ${project.title}`}
                                sizes="(max-width: 1023px) 100vw, 50vw"
                                className="object-contain object-center transition-opacity duration-500 group-hover:opacity-90"
                                fallback={<span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">IMAGE UNAVAILABLE</span>}
                              />
                            ) : <span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">NO PROJECT IMAGE</span>}
                          </div>

                          <div className="min-w-0 lg:py-2">
                            <div className="flex flex-wrap items-center gap-3 font-mono text-[0.68rem] tracking-[0.08em] text-ink-muted">
                              <span>{String(index + 1).padStart(2, "0")} / PROJECT</span>
                              {project.featured ? <Badge tone="accent">FEATURED</Badge> : null}
                            </div>
                            <h2 className="mt-4 break-words text-2xl font-medium tracking-tight sm:text-3xl">
                              {project.title}
                            </h2>
                            {description ? (
                              <p className="mt-4 text-sm leading-7 text-ink-secondary sm:text-base">
                                {description}
                              </p>
                            ) : null}

                            {project.github_url || project.live_url ? (
                              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                                {project.github_url ? (
                                  <a
                                    href={project.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-1 text-ink-secondary hover:text-ink"
                                  >
                                    GitHub <ArrowUpRight size={14} aria-hidden="true" />
                                  </a>
                                ) : null}
                                {project.live_url ? (
                                  <a
                                    href={project.live_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-1 text-ink-secondary hover:text-ink"
                                  >
                                    Live demo <ArrowUpRight size={14} aria-hidden="true" />
                                  </a>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-6">
                              <Button href={`/projects/${encodeURIComponent(project.slug)}`} variant="text">
                                View project <span aria-hidden="true">→</span>
                              </Button>
                            </div>
                          </div>
                        </article>
                      </Reveal>
                      {index < projects.length - 1 ? <Divider /> : null}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="border-t border-border py-8 text-sm text-ink-muted" role={unavailable ? "status" : undefined}>
                {unavailable
                  ? "Projects are currently unavailable. Please try again later."
                  : "No projects are available yet."}
              </p>
            )}
          </Container>
        </Section>
      </main>

      <PortfolioFooter name={null} />
    </>
  );
}
