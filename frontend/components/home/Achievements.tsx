import { ArrowUpRight } from "lucide-react";
import type { Achievement } from "@/types/api";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

type AchievementsProps = {
  achievements: readonly Achievement[];
};

function formatAchievementDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function Achievements({ achievements }: AchievementsProps) {
  return (
    <Section id="achievements" aria-labelledby="achievements-title" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            id="achievements-title"
            eyebrow="05 / ACHIEVEMENTS"
            title="Recognition and milestones."
            description="A short record of results and contributions beyond day-to-day work."
          />

          {achievements.length > 0 ? (
            <ol className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement, index) => {
                const description = achievement.short_description || achievement.description;
                const date = formatAchievementDate(achievement.date);

                return (
                  <li key={achievement.id}>
                    <article className="h-full border-t border-border pt-4">
                      {achievement.image ? (
                        <div className="relative aspect-[16/10] overflow-hidden border border-border bg-surface">
                          <ImageWithFallback
                            src={achievement.image}
                            alt={`Achievement: ${achievement.title}`}
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                            className="object-cover"
                            fallback={<span className="flex h-full items-center justify-center font-mono text-xs tracking-[0.08em] text-ink-muted">IMAGE UNAVAILABLE</span>}
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 pt-4">
                        <p className="font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</p>
                        <h3 className="mt-2 break-words text-lg font-medium tracking-tight sm:text-xl">
                          {achievement.title}
                        </h3>
                        {description ? (
                          <p className="mt-2 text-sm leading-6 text-ink-muted">
                            {description}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                          {date ? (
                            <time dateTime={achievement.date ?? undefined} className="font-mono text-[0.68rem] tracking-[0.05em] text-ink-muted">
                              {date}
                            </time>
                          ) : <span />}
                        {achievement.link ? (
                          <a
                            href={achievement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                          >
                            Read more <ArrowUpRight size={14} aria-hidden="true" />
                          </a>
                        ) : null}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-8 border-t border-border pt-5 text-sm text-ink-muted">
              No achievements are available yet.
            </p>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}
