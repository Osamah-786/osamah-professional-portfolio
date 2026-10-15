import Image from "next/image";
import type { PortfolioSection, SectionBlock } from "@/lib/api/sections";

function renderFieldValue(type: string, value: unknown, label: string) {
  if (type === "image" && typeof value === "string") return <div className="relative mt-2 aspect-video max-w-xl overflow-hidden border border-border bg-surface-raised"><Image src={value} alt={label} fill unoptimized sizes="(max-width: 768px) 100vw, 40vw" className="object-contain" /></div>;
  if ((type === "file" || type === "url") && typeof value === "string") return <a href={value} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{type === "file" ? `Open ${label}` : value}</a>;
  if (type === "links" && Array.isArray(value)) return <ul className="space-y-1">{value.map((item, index) => {
    if (typeof item !== "object" || item === null || !("url" in item) || typeof item.url !== "string") return null;
    const labelText = "label" in item && typeof item.label === "string" ? item.label : item.url;
    return <li key={`${item.url}-${index}`}><a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{labelText}</a></li>;
  })}</ul>;
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => <span key={`${String(item)}-${index}`} className="mr-2">{typeof item === "string" || typeof item === "number" ? String(item) : ""}</span>);
}

export function CustomSectionContent({ blocks, fields = [], values = {} }: { blocks: readonly SectionBlock[]; fields?: PortfolioSection["custom_fields"]; values?: Record<string, unknown> }) {
  return <div className="space-y-6">
    {blocks.map((block, index) => {
      if (block.type === "heading") return <h2 key={index} className="text-2xl font-medium tracking-tight text-ink">{block.title}</h2>;
      if (block.type === "paragraph") return <p key={index} className="whitespace-pre-wrap text-base leading-8 text-ink-secondary">{block.text}</p>;
      if (block.type === "list") return <ul key={index} className="list-disc space-y-2 pl-6 text-ink-secondary">{block.items?.map((item) => <li key={item}>{item}</li>)}</ul>;
      if (block.type === "quote") return <blockquote key={index} className="border-l-2 border-accent pl-5 text-lg italic leading-8 text-ink-secondary">{block.text}</blockquote>;
      if (block.type === "callout") return <aside key={index} className="border border-border bg-surface-raised p-5 text-ink-secondary">{block.text}</aside>;
      if (block.type === "image" && block.url) return <figure key={index} className="relative aspect-video overflow-hidden border border-border bg-surface-raised"><Image src={block.url} alt={block.alt_text ?? ""} fill unoptimized sizes="(max-width: 768px) 100vw, 80vw" className="object-contain" /></figure>;
      if (block.type === "gallery") return <div key={index} className="grid gap-4 sm:grid-cols-2">{block.images?.map((image) => <figure key={`${image.url}-${image.alt_text}`}><div className="relative aspect-video overflow-hidden border border-border bg-surface-raised"><Image src={image.url} alt={image.alt_text} fill unoptimized sizes="(max-width: 768px) 100vw, 40vw" className="object-contain" /></div>{image.caption ? <figcaption className="mt-2 text-sm text-ink-muted">{image.caption}</figcaption> : null}</figure>)}</div>;
      if (block.type === "links") return <ul key={index} className="flex flex-wrap gap-3">{block.links?.map((link) => <li key={`${link.url}-${link.label}`}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">{link.label}</a></li>)}</ul>;
      return null;
    })}
    {fields.length ? <dl className="grid gap-4 sm:grid-cols-2">{fields.map((field) => {
      const value = values[field.name];
      if (value === undefined || value === null || value === "") return null;
      return <div key={field.name} className="border-t border-border pt-3"><dt className="font-mono text-xs uppercase tracking-wide text-accent">{field.label}</dt><dd className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
        {renderFieldValue(field.type, value, field.label)}
      </dd></div>;
    })}</dl> : null}
  </div>;
}
