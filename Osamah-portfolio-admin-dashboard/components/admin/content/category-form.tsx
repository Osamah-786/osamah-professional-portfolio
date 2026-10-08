"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/form-controls";
import type { SkillCategory, SkillCategoryInput } from "@/lib/api/skills";

type Props = { category: SkillCategory | null; onSave: (input: SkillCategoryInput) => Promise<void>; onClose: () => void };

export function CategoryForm({ category, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(category?.name ?? "");
  const [order, setOrder] = useState(String(category?.display_order ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  function close() { if (!saving) { dialog.current?.close(); onClose(); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const displayOrder = Number(order);
    if (!name.trim()) { setError("Category name is required."); return; }
    if (!Number.isSafeInteger(displayOrder)) { setError("Display order must be a whole number."); return; }
    setSaving(true);
    try { await onSave({ name: name.trim(), display_order: displayOrder }); dialog.current?.close(); onClose(); }
    catch (cause) {
      const code = cause instanceof Error ? cause.message : "unavailable";
      setError(code === "conflict" ? "A category with this name already exists." : code === "validation" ? "Check the category details and try again." : "Unable to save this category right now.");
    } finally { setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="category-form-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === dialog.current) close(); }} className="m-auto w-[min(32rem,calc(100%-2rem))] border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
    <form onSubmit={submit} className="p-5 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">SKILLS / CATEGORY</p><h3 id="category-form-title" className="mt-2 font-serif text-2xl">{category ? "Edit category" : "Add category"}</h3></div><Button onClick={close} disabled={saving} size="small">Close</Button></div>
      <div className="space-y-5"><div><FieldLabel htmlFor="category-name">Category name *</FieldLabel><Input id="category-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></div><div><FieldLabel htmlFor="category-order">Display order</FieldLabel><Input id="category-order" type="number" step="1" value={order} onChange={(event) => setOrder(event.target.value)} /></div></div>
      {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row"><Button onClick={close} disabled={saving}>Cancel</Button><Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : category ? "Save changes" : "Create category"}</Button></div>
    </form>
  </dialog>;
}
