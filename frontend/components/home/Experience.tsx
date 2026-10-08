import Image from "next/image";
import type { Experience as ExperienceRecord } from "@/types/api";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ExperienceProps = {
  experiences: readonly ExperienceRecord[];
  unavailable?: boolean;
};

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

function formatDateRange(experience: ExperienceRecord): string | null {
  const start = formatMonthYear(experience.start_date);
  const end = experience.currently_working
    ? "Present"
    : formatMonthYear(experience.end_date);

  if (start && end) return `${start} — ${end}`;
  return start ?? end;
}

export function Experience({ experiences, unavailable = false }: ExperienceProps) {
  return (
    <Section id="experience" aria-labelledby="experience-title" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            id="experience-title"
            eyebrow="02 / EXPERIENCE"
            title="Work shaped by collaboration."
            description="A concise record of roles, teams, and the problems worked on together."
          />

          {experiences.length > 0 ? (
            <ol className="mt-10">
              {experiences.map((experience, index) => {
                const dateRange = formatDateRange(experience);
                const description = experience.short_description || experience.description;

                return (
                  <li key={experience.id}>
                    <article className="grid gap-4 py-6 sm:grid-cols-[minmax(9rem,0.65fr)_minmax(0,2fr)] sm:gap-8 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2fr)] lg:gap-12">
                      <div>
                        {dateRange ? (
                          <p className="font-mono text-xs tracking-[0.07em] text-accent">
                            {dateRange}
                          </p>
                        ) : null}
                        {experience.location ? (
                          <p className="mt-2 text-sm text-ink-muted">{experience.location}</p>
                        ) : null}
                      </div>
                      <div className="flex max-w-3xl gap-4">
                        {experience.company_logo ? (
                          <Image
                            src={experience.company_logo}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 shrink-0 border border-border bg-surface object-contain p-1"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-medium tracking-tight sm:text-2xl">
                            {experience.role}
                          </h3>
                          <p className="mt-1 text-sm text-ink-secondary">{experience.company}</p>
                          {description ? (
                            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
                              {description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                    {index < experiences.length - 1 ? <Divider /> : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-8 border-t border-border pt-5 text-sm text-ink-muted" role={unavailable ? "status" : undefined}>
              {unavailable
                ? "Experience details are temporarily unavailable. Please try again later."
                : "No experience records are available yet."}
            </p>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}
