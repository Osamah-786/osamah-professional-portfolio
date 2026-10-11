import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

type FeaturedProjectsProps = {
  projects: readonly Project[];
  unavailable?: boolean;
};

function ProjectImage({ src, title, sizes }: { src: string | null; title: string; sizes: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden border border-border bg-surface">
      {src ? (
        <ImageWithFallback
          src={src}
          alt={`Project preview for ${title}`}
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          fallback={<span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">IMAGE UNAVAILABLE</span>}
        />
      ) : <span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">NO PROJECT IMAGE</span>}
    </div>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  if (!project.github_url && !project.live_url) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-5 text-sm">
      {project.github_url ? (
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-ink-secondary hover:text-ink"
        >
          Source <ArrowUpRight size={14} aria-hidden="true" />
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
  );
}

export function FeaturedProjects({ projects, unavailable = false }: FeaturedProjectsProps) {
  const [primaryProject, ...secondaryProjects] = projects;

  return (
    <Section id="selected-work" aria-labelledby="selected-work-title" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            id="selected-work-title"
            eyebrow="01 / SELECTED WORK"
            title="Systems built for real use."
            description="A small selection of projects, with an emphasis on clear problems, thoughtful architecture, and useful outcomes."
          />

          {primaryProject ? (
            <div className="mt-10 grid gap-9 lg:grid-cols-12 lg:gap-10">
              <article className="group min-w-0 border-t border-border pt-4 lg:col-span-7">
                <ProjectImage
                  src={primaryProject.cover_image}
                  title={primaryProject.title}
                  sizes="(max-width: 1023px) 100vw, 60vw"
                />
                <div className="pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[0.68rem] tracking-[0.08em] text-ink-muted">
                    <span>01 / FEATURED SYSTEM</span>
                    {primaryProject.featured ? <Badge tone="accent">FEATURED</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">
                    <Link href={`/projects/${encodeURIComponent(primaryProject.slug)}`} className="no-underline hover:text-accent">
                      {primaryProject.title}
                    </Link>
                  </h3>
                  {primaryProject.short_description || primaryProject.description ? (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base sm:leading-7">
                      {primaryProject.short_description ?? primaryProject.description}
                    </p>
                  ) : null}
                  <ProjectLinks project={primaryProject} />
                </div>
              </article>

              {secondaryProjects.length > 0 ? (
                <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                  {secondaryProjects.map((project, index) => (
                    <article
                      key={project.id}
                      className="group min-w-0 border-t border-border pt-4"
                    >
                      <ProjectImage
                        src={project.cover_image}
                        title={project.title}
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 40vw"
                      />
                      <div className="min-w-0 pt-4">
                        <p className="font-mono text-[0.65rem] tracking-[0.08em] text-ink-muted">
                          {String(index + 2).padStart(2, "0")} / SUPPORTING PROJECT
                        </p>
                        <h3 className="mt-2 break-words text-lg font-medium leading-snug tracking-tight sm:text-xl">
                          <Link href={`/projects/${encodeURIComponent(project.slug)}`} className="no-underline hover:text-accent">
                            {project.title}
                          </Link>
                        </h3>
                        {project.short_description || project.description ? (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">
                            {project.short_description ?? project.description}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-8 border-t border-border pt-5 text-sm text-ink-muted" role={unavailable ? "status" : undefined}>
              {unavailable
                ? "Featured projects are temporarily unavailable. Please try again later."
                : "No featured projects are available yet."}
            </p>
          )}

          <div className="mt-7 flex justify-end">
            <Button href="/projects" variant="text">
              View all projects <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
