"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/form-controls";
import type { Achievement, AchievementInput } from "@/lib/api/achievements";

type Props = { achievement: Achievement | null; onSave: (input: AchievementInput) => Promise<void>; onClose: () => void };
type Values = { title: string; short_description: string; description: string; image: string; link: string; date: string; featured: boolean; display_order: string };

function initialValues(item: Achievement | null): Values {
  return { title: item?.title ?? "", short_description: item?.short_description ?? "", description: item?.description ?? "", image: item?.image ?? "", link: item?.link ?? "", date: item?.date?.slice(0, 10) ?? "", featured: item?.featured ?? false, display_order: String(item?.display_order ?? 0) };
}

function optionalUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try { const url = new URL(trimmed); if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(); return trimmed; }
  catch { throw new Error(`${label} must be a valid HTTP or HTTPS URL.`); }
}

export function AchievementForm({ achievement, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(() => initialValues(achievement));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  function update<K extends keyof Values>(key: K, value: Values[K]) { setValues((current) => ({ ...current, [key]: value })); }
  function close() { if (!saving) { dialog.current?.close(); onClose(); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!values.title.trim()) { setError("Title is required."); return; }
    const order = Number(values.display_order);
    if (!Number.isSafeInteger(order)) { setError("Display order must be a whole number."); return; }
    if (values.date && Number.isNaN(Date.parse(`${values.date}T00:00:00`))) { setError("Enter a valid date."); return; }
    let image: string | null; let link: string | null;
    try { image = optionalUrl(values.image, "Image URL"); link = optionalUrl(values.link, "Link URL"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Check the URLs and try again."); return; }
    const input: AchievementInput = { title: values.title.trim(), short_description: values.short_description.trim() || null, description: values.description.trim() || null, image, link, date: values.date || null, featured: values.featured, display_order: order };
    setSaving(true);
    try { await onSave(input); dialog.current?.close(); onClose(); }
    catch (cause) {
      const code = cause instanceof Error ? cause.message : "unavailable";
      setError(code === "validation" ? "Check the achievement details and try again." : "Unable to save this achievement right now.");
    } finally { setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="achievement-form-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === dialog.current) close(); }} className="m-auto max-h-[min(92vh,56rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
    <form onSubmit={submit} className="p-5 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">ACHIEVEMENTS / EDITOR</p><h3 id="achievement-form-title" className="mt-2 font-serif text-2xl">{achievement ? "Edit achievement" : "Add achievement"}</h3></div><Button onClick={close} disabled={saving} size="small">Close</Button></div>
      <div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><FieldLabel htmlFor="achievement-title">Title *</FieldLabel><Input id="achievement-title" required maxLength={255} value={values.title} onChange={(event) => update("title", event.target.value)} autoFocus /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="achievement-short-description">Short description</FieldLabel><Textarea id="achievement-short-description" maxLength={500} value={values.short_description} onChange={(event) => update("short_description", event.target.value)} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="achievement-description">Description</FieldLabel><Textarea id="achievement-description" className="min-h-36" value={values.description} onChange={(event) => update("description", event.target.value)} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="achievement-image">Image URL</FieldLabel><Input id="achievement-image" type="url" inputMode="url" maxLength={2048} placeholder="https://…" value={values.image} onChange={(event) => update("image", event.target.value)} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="achievement-link">External link</FieldLabel><Input id="achievement-link" type="url" inputMode="url" maxLength={2048} placeholder="https://…" value={values.link} onChange={(event) => update("link", event.target.value)} /></div>
        <div><FieldLabel htmlFor="achievement-date">Date</FieldLabel><Input id="achievement-date" type="date" value={values.date} onChange={(event) => update("date", event.target.value)} /></div>
        <div><FieldLabel htmlFor="achievement-order">Display order</FieldLabel><Input id="achievement-order" type="number" step="1" value={values.display_order} onChange={(event) => update("display_order", event.target.value)} /></div>
        <label className="flex min-h-11 items-center gap-3 text-sm text-ink-secondary"><input type="checkbox" checked={values.featured} onChange={(event) => update("featured", event.target.checked)} className="size-4 accent-[var(--color-accent)]" />Feature this achievement</label>
      </div>
      {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row"><Button onClick={close} disabled={saving}>Cancel</Button><Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : achievement ? "Save changes" : "Create achievement"}</Button></div>
    </form>
  </dialog>;
}
