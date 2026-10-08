"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Select } from "@/components/ui/form-controls";
import type { Skill, SkillCategory, SkillInput } from "@/lib/api/skills";

type Props = { skill: Skill | null; categories: SkillCategory[]; onSave: (input: SkillInput) => Promise<void>; onClose: () => void };

function optionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try { const url = new URL(trimmed); if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(); return trimmed; }
  catch { throw new Error("Icon URL must be a valid HTTP or HTTPS URL."); }
}

export function SkillForm({ skill, categories, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(skill?.name ?? "");
  const [categoryId, setCategoryId] = useState(String(skill?.category_id ?? categories[0]?.id ?? ""));
  const [icon, setIcon] = useState(skill?.icon ?? "");
  const [order, setOrder] = useState(String(skill?.display_order ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  function close() { if (!saving) { dialog.current?.close(); onClose(); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const selectedCategory = Number(categoryId);
    const displayOrder = Number(order);
    if (!name.trim()) { setError("Skill name is required."); return; }
    if (!Number.isSafeInteger(selectedCategory) || selectedCategory <= 0 || !categories.some((category) => category.id === selectedCategory)) { setError("Choose a valid category."); return; }
    if (!Number.isSafeInteger(displayOrder)) { setError("Display order must be a whole number."); return; }
    let iconUrl: string | null;
    try { iconUrl = optionalUrl(icon); } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the icon URL."); return; }
    setSaving(true);
    try { await onSave({ name: name.trim(), category_id: selectedCategory, icon: iconUrl, display_order: displayOrder }); dialog.current?.close(); onClose(); }
    catch (cause) {
      const code = cause instanceof Error ? cause.message : "unavailable";
      setError(code === "conflict" ? "This skill name already exists in the selected category." : code === "not_found" ? "The selected category is no longer available. Reload and try again." : code === "validation" ? "Check the skill details and try again." : "Unable to save this skill right now.");
    } finally { setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="skill-form-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === dialog.current) close(); }} className="m-auto w-[min(36rem,calc(100%-2rem))] border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
    <form onSubmit={submit} className="p-5 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">SKILLS / EDITOR</p><h3 id="skill-form-title" className="mt-2 font-serif text-2xl">{skill ? "Edit skill" : "Add skill"}</h3></div><Button onClick={close} disabled={saving} size="small">Close</Button></div>
      <div className="space-y-5"><div><FieldLabel htmlFor="skill-name">Skill name *</FieldLabel><Input id="skill-name" required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></div><div><FieldLabel htmlFor="skill-category">Category *</FieldLabel><Select id="skill-category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div><div><FieldLabel htmlFor="skill-icon">Icon URL</FieldLabel><Input id="skill-icon" type="url" inputMode="url" placeholder="https://…" value={icon} onChange={(event) => setIcon(event.target.value)} /></div><div><FieldLabel htmlFor="skill-order">Display order</FieldLabel><Input id="skill-order" type="number" step="1" value={order} onChange={(event) => setOrder(event.target.value)} /></div></div>
      {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row"><Button onClick={close} disabled={saving}>Cancel</Button><Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : skill ? "Save changes" : "Create skill"}</Button></div>
    </form>
  </dialog>;
}
