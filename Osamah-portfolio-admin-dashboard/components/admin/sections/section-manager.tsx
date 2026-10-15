"use client";

import { useEffect, useState } from "react";
import type { SectionBlock } from "@/lib/api/sections";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

type Section = {
  id: number; key: string; slug: string; section_type: "built_in" | "custom"; title: string;
  enabled: boolean; status: "draft" | "published" | "archived"; display_order: number;
  show_on_homepage: boolean; show_on_full_page: boolean; short_description: string | null;
  long_description: string | null; read_more_enabled: boolean; layout_variant: string;
  content_blocks: SectionBlock[]; custom_fields: { name: string; label: string; type: string; required: boolean }[]; custom_field_values: Record<string, unknown>;
};
const emptyDraft = { title: "", slug: "", short_description: "", long_description: "", blocks: "[]", fields: "[]", fieldValues: "{}", cover: "", coverAlt: "", seoTitle: "", metaDescription: "", layout: "standard", homepage: true, fullPage: true, readMore: false, status: "draft" };

export function SectionManager({ initialSections }: { initialSections: unknown[] | null }) {
  const [sections, setSections] = useState<Section[] | null>(initialSections as Section[] | null);
  const [editing, setEditing] = useState<Section | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<Section | null>(null);
  useEffect(() => {
    if (!showForm) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [showForm]);
  async function request(path: string, method: string, body?: unknown) {
    const response = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) { const payload = await response.json().catch(() => null) as { code?: string } | null; throw new Error(payload?.code ?? "unavailable"); }
    return response.status === 204 ? null : response.json();
  }
  async function reload() { const response = await fetch("/api/admin/sections", { cache: "no-store" }); if (!response.ok) throw new Error("unavailable"); setSections(await response.json() as Section[]); }
  function startNew() { setEditing(null); setShowForm(true); setDraft(emptyDraft); setError(""); setFeedback(""); }
  function startEdit(section: Section) { setEditing(section); setShowForm(true); setDraft({ ...emptyDraft, title: section.title, slug: section.slug, short_description: section.short_description ?? "", long_description: section.long_description ?? "", blocks: JSON.stringify(section.content_blocks, null, 2), fields: JSON.stringify(section.custom_fields, null, 2), fieldValues: JSON.stringify(section.custom_field_values, null, 2), status: section.status, homepage: section.show_on_homepage, fullPage: section.show_on_full_page, readMore: section.read_more_enabled, layout: section.layout_variant }); setError(""); setFeedback(""); }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setFeedback("");
    try {
      const content_blocks = JSON.parse(draft.blocks) as unknown;
      if (!Array.isArray(content_blocks)) throw new Error("validation");
      const custom_fields = JSON.parse(draft.fields) as unknown;
      const custom_field_values = JSON.parse(draft.fieldValues) as unknown;
      if (!Array.isArray(custom_fields) || typeof custom_field_values !== "object" || custom_field_values === null || Array.isArray(custom_field_values)) throw new Error("validation");
      const values = { title: draft.title, slug: draft.slug, short_description: draft.short_description || null, long_description: draft.long_description || null, content_blocks, custom_fields, custom_field_values, cover_image: draft.cover || null, cover_image_alt: draft.cover ? draft.coverAlt || null : null, seo_title: draft.seoTitle || null, meta_description: draft.metaDescription || null, layout_variant: draft.layout, read_more_enabled: draft.readMore, status: editing ? draft.status : "draft", enabled: editing?.enabled ?? true, show_on_homepage: draft.homepage, show_on_full_page: draft.fullPage };
      if (editing) await request(`/api/admin/sections/${editing.id}`, "PUT", values);
      else await request("/api/admin/sections", "POST", { ...values, section_type: "custom" });
      await reload(); setEditing(null); setShowForm(false); setFeedback(editing ? "Section updated." : "Draft section created.");
    } catch (cause) { setError(cause instanceof Error && cause.message === "validation" ? "Check the JSON content blocks, custom fields, and field values." : "Unable to save this section. Check the slug and try again."); }
    finally { setBusy(false); }
  }
  async function change(section: Section, values: Record<string, unknown>, message: string) { setBusy(true); setError(""); try { await request(`/api/admin/sections/${section.id}`, "PUT", values); await reload(); setFeedback(message); } catch { setError("The section could not be updated."); } finally { setBusy(false); } }
  async function remove(section: Section) { if (!window.confirm(`Delete the custom section “${section.title}”?`)) return; try { await request(`/api/admin/sections/${section.id}`, "DELETE"); await reload(); setFeedback("Custom section deleted."); } catch { setError("This section could not be deleted."); } }
  async function duplicate(section: Section) { const title = window.prompt("Title for the duplicate", `${section.title} copy`); if (!title) return; const slug = window.prompt("Slug for the duplicate", `${section.slug}-copy`); if (!slug) return; try { await request(`/api/admin/sections/${section.id}/duplicate`, "POST", { title, slug }); await reload(); setFeedback("Draft duplicate created."); } catch { setError("Duplicate could not be created. Check that its title and slug are unique."); } }
  async function move(index: number, direction: -1 | 1) { if (!sections) return; const ordered = [...sections]; const target = index + direction; if (target < 0 || target >= ordered.length) return; [ordered[index], ordered[target]] = [ordered[target], ordered[index]]; setSections(ordered); try { await request("/api/admin/sections/reorder", "PUT", { ids: ordered.map((item) => item.id) }); } catch { setError("Ordering could not be saved."); await reload(); } }
  async function drop(target: number) { if (dragIndex === null || !sections || dragIndex === target) return; const ordered = [...sections]; const [picked] = ordered.splice(dragIndex, 1); ordered.splice(target, 0, picked); setDragIndex(null); setSections(ordered); try { await request("/api/admin/sections/reorder", "PUT", { ids: ordered.map((item) => item.id) }); } catch { setError("Ordering could not be saved."); await reload(); } }
  function closeForm() { if (showForm && !window.confirm("Discard changes to this section?")) return; setEditing(null); setShowForm(false); setDraft(emptyDraft); }
  return <>
    <PageHeader eyebrow="CONTENT / SECTION BUILDER" title="Sections" description="Configure the order and visibility of existing portfolio content, or create custom sections." actions={<Button variant="primary" onClick={startNew}>Add custom section</Button>} />
    {feedback ? <p role="status" className="mb-4 border border-border bg-surface-raised px-4 py-3 text-sm text-ink">{feedback}</p> : null}
    {error ? <p role="alert" className="mb-4 border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">{error}</p> : null}
    {sections === null ? <p role="status" className="border border-border p-6 text-sm text-ink-muted">Section registry unavailable. Apply the documented database migration, then reload.</p> : <ol className="space-y-3">{sections.map((section, index) => <li key={section.id} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => void drop(index)} onDragEnd={() => setDragIndex(null)} className={`flex flex-wrap items-center gap-3 border border-border bg-surface-raised p-4 ${dragIndex === index ? "opacity-50" : ""}`}>
      <div className="mr-auto min-w-48"><p className="font-medium text-ink">{section.title} <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-accent">{section.section_type}</span></p><p className="mt-1 text-xs text-ink-muted">/{section.slug} · {section.status} · {section.enabled ? "visible" : "hidden"}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label={`Move ${section.title} up`}>↑</Button><Button disabled={busy || index === sections.length - 1} onClick={() => void move(index, 1)} aria-label={`Move ${section.title} down`}>↓</Button>
        <Button disabled={busy} onClick={() => startEdit(section)}>Edit</Button><Button disabled={busy} onClick={() => void duplicate(section)}>Duplicate</Button>
        <Button disabled={busy} onClick={() => void change(section, { enabled: !section.enabled }, section.enabled ? "Section hidden." : "Section shown.")}>{section.enabled ? "Hide" : "Show"}</Button>
        <Button disabled={busy} onClick={() => void change(section, { status: section.status === "published" ? "draft" : "published" }, section.status === "published" ? "Section moved to draft." : "Section published.")}>{section.status === "published" ? "Unpublish" : "Publish"}</Button>
        {section.status === "archived" ? <Button disabled={busy} onClick={() => void change(section, { status: "draft" }, "Section restored as draft.")}>Restore</Button> : <Button disabled={busy} onClick={() => void change(section, { status: "archived" }, "Section archived.")}>Archive</Button>}
        {section.section_type === "custom" ? <Button disabled={busy} onClick={() => void remove(section)}>Delete</Button> : null}
        <Button disabled={busy} onClick={() => setPreview(section)}>Preview</Button>
      </div>
    </li>)}</ol>}
    {showForm ? <form onSubmit={(event) => void save(event)} className="mt-6 space-y-4 border border-border bg-surface-raised p-5" aria-label={editing ? "Edit section" : "Create section"}>
      <div className="flex items-center justify-between"><h2 className="text-lg text-ink">{editing ? `Edit ${editing.title}` : "New custom section"}</h2><Button type="button" onClick={closeForm}>Close</Button></div>
      <label className="block text-sm text-ink-muted">Title<input required maxLength={150} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <label className="block text-sm text-ink-muted">URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={150} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <label className="block text-sm text-ink-muted">Short description<textarea maxLength={500} value={draft.short_description} onChange={(e) => setDraft({ ...draft, short_description: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <label className="block text-sm text-ink-muted">Long description<textarea maxLength={10000} value={draft.long_description} onChange={(e) => setDraft({ ...draft, long_description: e.target.value })} className="mt-1 min-h-24 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <label className="block text-sm text-ink-muted">Content blocks (JSON; supported types: heading, paragraph, list, image, gallery, links, quote, callout)<textarea value={draft.blocks} onChange={(e) => setDraft({ ...draft, blocks: e.target.value })} spellCheck={false} className="mt-1 min-h-48 w-full font-mono text-xs border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <label className="block text-sm text-ink-muted">Custom field definitions (JSON: name, label, type, required; types: text, textarea, rich_text, URL, date, number, tags, image, file, links)<textarea value={draft.fields} onChange={(e) => setDraft({ ...draft, fields: e.target.value })} spellCheck={false} className="mt-1 min-h-28 w-full font-mono text-xs border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <label className="block text-sm text-ink-muted">Custom field values (JSON object)<textarea value={draft.fieldValues} onChange={(e) => setDraft({ ...draft, fieldValues: e.target.value })} spellCheck={false} className="mt-1 min-h-24 w-full font-mono text-xs border border-border bg-canvas px-3 py-2 text-ink" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm text-ink-muted">Cover image URL<input type="url" value={draft.cover} onChange={(e) => setDraft({ ...draft, cover: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label><label className="block text-sm text-ink-muted">Cover image alt text<input value={draft.coverAlt} onChange={(e) => setDraft({ ...draft, coverAlt: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm text-ink-muted">SEO title<input maxLength={200} value={draft.seoTitle} onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label><label className="block text-sm text-ink-muted">Meta description<input maxLength={320} value={draft.metaDescription} onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })} className="mt-1 w-full border border-border bg-canvas px-3 py-2 text-ink" /></label></div>
      <div className="flex flex-wrap gap-4 text-sm text-ink-muted"><label>Layout <select value={draft.layout} onChange={(e) => setDraft({ ...draft, layout: e.target.value })} className="ml-2 border border-border bg-canvas px-2 py-2 text-ink">{["standard", "cards", "split", "editorial", "full_width"].map((layout) => <option key={layout}>{layout}</option>)}</select></label><label className="flex items-center gap-2"><input type="checkbox" checked={draft.homepage} onChange={(e) => setDraft({ ...draft, homepage: e.target.checked })} />Homepage</label><label className="flex items-center gap-2"><input type="checkbox" checked={draft.fullPage} onChange={(e) => setDraft({ ...draft, fullPage: e.target.checked })} />Full page</label><label className="flex items-center gap-2"><input type="checkbox" checked={draft.readMore} onChange={(e) => setDraft({ ...draft, readMore: e.target.checked })} />Read More page</label>{editing ? <label>Status <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className="ml-2 border border-border bg-canvas px-2 py-2 text-ink">{["draft", "published", "archived"].map((status) => <option key={status}>{status}</option>)}</select></label> : null}</div>
      <div className="flex gap-2"><Button type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : "Save draft"}</Button><Button type="button" onClick={closeForm}>Cancel</Button></div>
      <p className="text-xs text-ink-muted">Existing portfolio records stay in their current tables. Custom sections accept structured text and URL references; uploads and arbitrary HTML are not supported.</p>
    </form> : null}
    {preview ? <div role="dialog" aria-modal="true" aria-labelledby="section-preview-title" className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4"><div className="mx-auto my-10 max-w-4xl border border-border bg-canvas p-6"><div className="flex justify-between gap-4"><h2 id="section-preview-title" className="text-xl text-ink">Preview: {preview.title}</h2><Button onClick={() => setPreview(null)}>Close preview</Button></div><p className="mt-3 text-ink-muted">{preview.short_description}</p>{preview.long_description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-secondary">{preview.long_description}</p> : null}<div className="mt-6 space-y-4">{preview.content_blocks.map((block, index) => <div key={index}>{block.title ? <h3 className="text-lg text-ink">{block.title}</h3> : null}{block.text ? <p className="whitespace-pre-wrap text-sm leading-7 text-ink-secondary">{block.text}</p> : null}{block.items ? <ul className="list-disc pl-5 text-sm text-ink-secondary">{block.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>)}</div></div></div> : null}
  </>;
}
