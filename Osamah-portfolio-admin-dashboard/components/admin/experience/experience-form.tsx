"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/form-controls";
import type { Experience, ExperienceInput } from "@/lib/api/experience";

type Props = { experience: Experience | null; onSave: (input: ExperienceInput) => Promise<void>; onClose: () => void };
type Values = { company: string; role: string; company_logo: string; location: string; start_date: string; end_date: string; currently_working: boolean; short_description: string; description: string; featured: boolean; display_order: string };

function initialValues(record: Experience | null): Values {
  return {
    company: record?.company ?? "", role: record?.role ?? "", company_logo: record?.company_logo ?? "",
    location: record?.location ?? "", start_date: record?.start_date?.slice(0, 10) ?? "", end_date: record?.end_date?.slice(0, 10) ?? "",
    currently_working: record?.currently_working ?? false, short_description: record?.short_description ?? "",
    description: record?.description ?? "", featured: record?.featured ?? false, display_order: String(record?.display_order ?? 0),
  };
}

function optionalUrl(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return trimmed;
  } catch { throw new Error(`${label} must be a valid HTTP or HTTPS URL.`); }
}

export function ExperienceForm({ experience, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(() => initialValues(experience));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  function update<K extends keyof Values>(key: K, value: Values[K]) { setValues((current) => ({ ...current, [key]: value })); }
  function close() { if (!saving) { dialog.current?.close(); onClose(); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const order = Number(values.display_order);
    if (!values.company.trim() || !values.role.trim() || !values.start_date) { setError("Company, role, and start date are required."); return; }
    if (!Number.isSafeInteger(order)) { setError("Display order must be a whole number."); return; }
    if (!values.currently_working && !values.end_date) { setError("Add an end date or mark this role as current."); return; }
    if (values.end_date && values.end_date < values.start_date) { setError("End date cannot be earlier than start date."); return; }
    let companyLogo: string | null;
    try { companyLogo = optionalUrl(values.company_logo, "Company logo"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Check the company logo URL."); return; }
    const input: ExperienceInput = {
      company: values.company.trim(), role: values.role.trim(), company_logo: companyLogo,
      location: values.location.trim() || null, start_date: values.start_date, end_date: values.currently_working ? null : values.end_date,
      currently_working: values.currently_working, short_description: values.short_description.trim() || null,
      description: values.description.trim() || null, featured: values.featured, display_order: order,
    };
    setSaving(true);
    try { await onSave(input); dialog.current?.close(); onClose(); }
    catch { setError("Unable to save this experience entry. Check the details and try again."); }
    finally { setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="experience-form-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === dialog.current) close(); }} className="m-auto max-h-[min(92vh,56rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
    <form onSubmit={submit} className="p-5 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">EXPERIENCE / EDITOR</p><h2 id="experience-form-title" className="mt-2 font-serif text-2xl">{experience ? "Edit experience" : "Add experience"}</h2></div><Button onClick={close} disabled={saving} size="small" aria-label="Close experience form">Close</Button></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><FieldLabel htmlFor="experience-company">Company *</FieldLabel><Input id="experience-company" required value={values.company} onChange={(e) => update("company", e.target.value)} /></div>
        <div><FieldLabel htmlFor="experience-role">Role *</FieldLabel><Input id="experience-role" required value={values.role} onChange={(e) => update("role", e.target.value)} /></div>
        <div><FieldLabel htmlFor="experience-location">Location</FieldLabel><Input id="experience-location" value={values.location ?? ""} onChange={(e) => update("location", e.target.value)} /></div>
        <div><FieldLabel htmlFor="experience-logo">Company logo URL</FieldLabel><Input id="experience-logo" type="url" inputMode="url" placeholder="https://…" value={values.company_logo ?? ""} onChange={(e) => update("company_logo", e.target.value)} /></div>
        <div><FieldLabel htmlFor="experience-start">Start date *</FieldLabel><Input id="experience-start" type="date" required value={values.start_date} onChange={(e) => update("start_date", e.target.value)} /></div>
        <div><FieldLabel htmlFor="experience-end">End date {!values.currently_working ? "*" : ""}</FieldLabel><Input id="experience-end" type="date" required={!values.currently_working} disabled={values.currently_working} min={values.start_date || undefined} value={values.currently_working ? "" : values.end_date ?? ""} onChange={(e) => update("end_date", e.target.value)} /></div>
        <label className="flex min-h-11 items-center gap-3 text-sm text-ink-secondary"><input type="checkbox" checked={values.currently_working} onChange={(e) => { update("currently_working", e.target.checked); if (e.target.checked) update("end_date", ""); }} className="size-4 accent-[var(--color-accent)]" />Currently working here</label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-ink-secondary"><input type="checkbox" checked={values.featured} onChange={(e) => update("featured", e.target.checked)} className="size-4 accent-[var(--color-accent)]" />Feature this experience</label>
        <div><FieldLabel htmlFor="experience-order">Display order</FieldLabel><Input id="experience-order" type="number" step="1" value={values.display_order} onChange={(e) => update("display_order", e.target.value)} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="experience-short">Short description</FieldLabel><Textarea id="experience-short" value={values.short_description ?? ""} onChange={(e) => update("short_description", e.target.value)} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="experience-description">Description</FieldLabel><Textarea id="experience-description" className="min-h-40" value={values.description ?? ""} onChange={(e) => update("description", e.target.value)} /></div>
      </div>
      {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row"><Button onClick={close} disabled={saving}>Cancel</Button><Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : experience ? "Save changes" : "Create experience"}</Button></div>
    </form>
  </dialog>;
}
