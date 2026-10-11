import Link from "next/link";
import { cache } from "react";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { getProjectBySlug } from "@/lib/api/projects";

const loadProject = cache((slug: string) => getProjectBySlug(slug));

function isProjectNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "http" && error.statusCode === 404;
}

function errorSummary(error: unknown): string {
  if (!(error instanceof ApiError)) return "unexpected error";
  return `${error.kind}${error.statusCode ? ` ${error.statusCode}` : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const project = await loadProject(slug);
    const description = project.short_description?.trim() || project.description?.trim();

    return {
      title: project.title,
      ...(description ? { description } : {}),
    };
  } catch (error) {
    return {
      title: isProjectNotFound(error) ? "Project not found" : "Project details unavailable",
    };
  }
}

function ProjectUnavailable() {
  return (
    <>
      <Navbar brand="PORTFOLIO" links={publicNavigationLinks} />
      <main id="main-content">
        <Section>
          <Container>
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Projects
            </Link>
            <p role="status" className="mt-10 border-t border-border pt-6 text-sm text-ink-muted">
              Project details are temporarily unavailable. Please try again later.
            </p>
          </Container>
        </Section>
      </main>
      <PortfolioFooter name={null} />
    </>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let project;

  try {
    project = await loadProject(slug);
  } catch (error) {
    if (isProjectNotFound(error)) notFound();
    console.error(`[project-detail] request failed (${errorSummary(error)}).`);
    return <ProjectUnavailable />;
  }

  const description = project.description?.trim() || project.short_description?.trim();

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
        <Section className="pb-10 sm:pb-14 lg:pb-16">
          <Container>
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Projects
            </Link>

            <Reveal>
              <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:items-end lg:gap-10">
                <div className="lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs tracking-[0.08em] text-ink-muted">
                    <span>PROJECT / {String(project.id).padStart(2, "0")}</span>
                    {project.featured ? <Badge tone="accent">FEATURED</Badge> : null}
                  </div>
                  <h1 className="mt-5 max-w-4xl break-words text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
                    {project.title}
                  </h1>
                  {project.short_description ? (
                    <p className="mt-5 max-w-3xl text-base leading-7 text-ink-secondary sm:text-lg sm:leading-8">
                      {project.short_description}
                    </p>
                  ) : null}
                </div>

                <div className="font-mono text-[0.68rem] tracking-[0.08em] text-ink-muted lg:col-span-4 lg:justify-self-end">
                  DISPLAY ORDER / {String(project.display_order).padStart(2, "0")}
                </div>
              </div>
            </Reveal>
          </Container>
        </Section>

        <Container>
          <Reveal>
            <figure className="relative aspect-[16/9] overflow-hidden border-y border-border bg-surface sm:aspect-[2/1]">
              {project.cover_image ? (
                <ImageWithFallback
                  src={project.cover_image}
                  alt={`Visual preview of ${project.title}`}
                  sizes="(max-width: 1023px) 100vw, 1200px"
                  className="object-cover"
                  priority
                  fallback={<span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">IMAGE UNAVAILABLE</span>}
                />
              ) : <span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">NO PROJECT IMAGE</span>}
            </figure>
          </Reveal>
        </Container>

        {description ? (
          <Section className="pb-12 sm:pb-16 lg:pb-20">
            <Container>
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-3">
                  <p className="font-mono text-xs tracking-[0.1em] text-accent">01 / OVERVIEW</p>
                </div>
                <div className="lg:col-span-8 lg:col-start-5">
                  <SectionHeading
                    as="h2"
                    eyebrow="THE PROJECT"
                    title="Overview"
                    className="max-w-none"
                  />
                  <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-ink-secondary sm:text-lg sm:leading-9">
                    {description}
                  </p>
                </div>
              </div>
            </Container>
          </Section>
        ) : null}

        {project.github_url || project.live_url ? (
          <>
            <Divider />
            <Section className="py-10 sm:py-12">
              <Container>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-xs tracking-[0.1em] text-ink-muted">
                    PROJECT LINKS
                  </p>
                  <div className="flex flex-wrap gap-x-7 gap-y-3">
                    {project.github_url ? (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-secondary underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        <Github size={16} aria-hidden="true" />
                        GitHub repository
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                    {project.live_url ? (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-secondary underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        Live demo
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </Container>
            </Section>
          </>
        ) : null}

        <Divider />

        <Section className="py-10 sm:py-14">
          <Container>
            <Button href="/projects" variant="text">
              Back to all projects <span aria-hidden="true">→</span>
            </Button>
          </Container>
        </Section>
      </main>

      <PortfolioFooter name={null} />
    </>
  );
}
