import type { Skill, SkillCategory } from "@/types/api";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

type SkillsProps = {
  categories: readonly SkillCategory[];
  skills: readonly Skill[];
  unavailable?: boolean;
};

export function Skills({ categories, skills, unavailable = false }: SkillsProps) {
  const skillsByCategory = new Map<number, Skill[]>();
  for (const skill of skills) {
    const categorySkills = skillsByCategory.get(skill.category_id) ?? [];
    categorySkills.push(skill);
    skillsByCategory.set(skill.category_id, categorySkills);
  }

  const populatedCategories = categories
    .map((category) => ({
      ...category,
      skills: skillsByCategory.get(category.id) ?? [],
    }))
    .filter((category) => category.skills.length > 0);

  return (
    <Section id="skills" aria-labelledby="skills-title" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            id="skills-title"
            eyebrow="03 / TECHNICAL SKILLS"
            title="Tools for building dependable systems."
            description="A grouped view of the languages, methods, and platforms used across engineering work."
          />

          {populatedCategories.length > 0 ? (
            <div className="mt-10 grid gap-x-10 md:grid-cols-2 lg:gap-x-16">
              {populatedCategories.map((category) => (
                <article key={category.id} className="border-t border-border py-5">
                  <h3 className="break-words font-mono text-xs font-medium tracking-[0.08em] text-ink-secondary sm:text-sm">
                    {category.name.toUpperCase()}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {category.skills.map((skill) => (
                      <li key={skill.id} className="break-words text-sm text-ink-muted sm:text-base">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-8 border-t border-border pt-5 text-sm text-ink-muted" role={unavailable ? "status" : undefined}>
              {unavailable
                ? "Skills are temporarily unavailable. Please try again later."
                : "No skills are available yet."}
            </p>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}
