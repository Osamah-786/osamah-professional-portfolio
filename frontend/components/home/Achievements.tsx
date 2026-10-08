import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Achievement } from "@/types/api";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
            <ol className="mt-9">
              {achievements.map((achievement, index) => {
                const description = achievement.short_description || achievement.description;
                const date = formatAchievementDate(achievement.date);

                return (
                  <li key={achievement.id}>
                    <article className="grid gap-x-6 gap-y-2 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-start">
                      <span className="font-mono text-xs text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-medium tracking-tight sm:text-xl">
                          {achievement.title}
                        </h3>
                        {description ? (
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
                            {description}
                          </p>
                        ) : null}
                        {achievement.image ? (
                          <Image
                            src={achievement.image}
                            alt=""
                            width={112}
                            height={72}
                            className="mt-3 h-[4.5rem] w-28 border border-border object-cover"
                          />
                        ) : null}
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
                      {date ? (
                        <time
                          dateTime={achievement.date ?? undefined}
                          className="font-mono text-[0.68rem] tracking-[0.05em] text-ink-muted sm:text-right"
                        >
                          {date}
                        </time>
                      ) : null}
                    </article>
                    {index < achievements.length - 1 ? <Divider /> : null}
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
