import Image from "next/image";
import type { PortfolioSection } from "@/lib/api/sections";
import { CustomSectionContent } from "@/components/sections/CustomSectionContent";
import type { Profile } from "@/types/api";

export function SectionDetail({ section, profile = null }: { section: PortfolioSection; profile?: Profile | null }) {
  const coverImage = section.cover_image ?? (section.key === "profile" ? profile?.profile_image ?? null : null);
  const coverAlt = section.cover_image ? section.cover_image_alt ?? "" : profile ? `Portrait of ${profile.name}` : "";
  return <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-24">
    <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">PORTFOLIO / {section.key.replaceAll("_", " ")}</p>
    <h1 className="mt-4 text-4xl font-medium tracking-tight text-ink sm:text-6xl">{section.title}</h1>
    {section.short_description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-muted">{section.short_description}</p> : null}
    {coverImage ? <div className="relative mt-10 aspect-video overflow-hidden border border-border bg-surface-raised"><Image src={coverImage} alt={coverAlt} fill unoptimized sizes="(max-width: 768px) 100vw, 80vw" className="object-contain" priority /></div> : null}
    {section.long_description ? <p className="mt-10 whitespace-pre-wrap text-base leading-8 text-ink-secondary">{section.long_description}</p> : null}
    {section.section_type === "custom" ? <div className="mt-10"><CustomSectionContent blocks={section.content_blocks} fields={section.custom_fields} values={section.custom_field_values} /></div> : section.key === "profile" ? <div className="mt-10">{profile?.headline ? <p className="text-xl text-ink">{profile.headline}</p> : null}{profile?.full_bio ? <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-ink-secondary">{profile.full_bio}</p> : <p className="text-sm text-ink-muted">The full profile biography is not available.</p>}{profile?.location ? <p className="mt-5 font-mono text-xs text-ink-muted">{profile.location}</p> : null}</div> : <p className="mt-8 text-sm text-ink-muted">This section is linked to existing portfolio records. Browse the portfolio to view its entries.</p>}
  </main>;
}
