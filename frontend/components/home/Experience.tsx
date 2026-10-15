import type { Experience as ExperienceRecord } from "@/types/api";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

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
                const description = experience.description || experience.short_description;

                return (
                  <li key={experience.id}>
                    <article className="py-6 sm:py-8">
                      <div className="relative aspect-video min-h-[220px] max-h-[280px] w-full overflow-hidden border border-border bg-surface-raised sm:min-h-[280px] sm:max-h-[320px] md:min-h-[300px] md:max-h-[340px] lg:min-h-[360px] lg:max-h-[420px]">
                        {experience.company_logo ? (
                          <ImageWithFallback
                            src={experience.company_logo}
                            alt={`${experience.company} logo`}
                            sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) calc(100vw - 4rem), (max-width: 1359px) calc(100vw - 5rem), 75rem"
                            className="object-contain object-center p-4 sm:p-6"
                            fallback={
                              <span aria-hidden="true" className="flex h-full w-full items-center justify-center text-5xl font-semibold text-ink-secondary sm:text-6xl">
                                {experience.company.trim().slice(0, 1).toUpperCase() || "•"}
                              </span>
                            }
                          />
                        ) : (
                          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-ink-secondary sm:text-6xl">
                            {experience.company.trim().slice(0, 1).toUpperCase() || "•"}
                          </span>
                        )}
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                        {dateRange ? (
                          <p className="font-mono text-xs tracking-[0.07em] text-accent">
                            {dateRange}
                          </p>
                        ) : null}
                        {experience.location ? (
                          <p className="text-sm text-ink-muted">{experience.location}</p>
                        ) : null}
                      </div>
                      <div className="mt-4 max-w-4xl">
                        <p className="break-words text-sm font-medium text-ink-secondary">{experience.company}</p>
                        <h3 className="mt-1 break-words text-xl font-medium tracking-tight sm:text-2xl">
                          {experience.role}
                        </h3>
                        {description ? (
                          <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
                            {description}
                          </p>
                        ) : null}
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
