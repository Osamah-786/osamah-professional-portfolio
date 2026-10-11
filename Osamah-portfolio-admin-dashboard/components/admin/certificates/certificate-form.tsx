"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/form-controls";
import { ImageUploadField } from "@/components/admin/content/image-upload-field";
import type { Certificate, CertificateInput } from "@/lib/api/certificates";

type Props = { certificate: Certificate | null; onSave: (input: CertificateInput) => Promise<void>; onClose: () => void };
type Values = { title: string; issuer: string; issue_date: string; credential_url: string; certificate_image: string; certificate_file: string; description: string; featured: boolean; display_order: string };

function initialValues(item: Certificate | null): Values {
  return { title: item?.title ?? "", issuer: item?.issuer ?? "", issue_date: item?.issue_date?.slice(0, 10) ?? "", credential_url: item?.credential_url ?? "", certificate_image: item?.certificate_image ?? "", certificate_file: item?.certificate_file ?? "", description: item?.description ?? "", featured: item?.featured ?? false, display_order: String(item?.display_order ?? 0) };
}

function optionalUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try { const url = new URL(trimmed); if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(); return trimmed; }
  catch { throw new Error(`${label} must be a valid HTTP or HTTPS URL.`); }
}

export function CertificateForm({ certificate, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(() => initialValues(certificate));
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  function update<K extends keyof Values>(key: K, value: Values[K]) { setValues((current) => ({ ...current, [key]: value })); }
  function close() { if (!saving && !uploadingImage) { dialog.current?.close(); onClose(); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!values.title.trim() || !values.issuer.trim()) { setError("Title and issuer are required."); return; }
    const order = Number(values.display_order);
    if (!Number.isSafeInteger(order)) { setError("Display order must be a whole number."); return; }
    if (values.issue_date && Number.isNaN(Date.parse(`${values.issue_date}T00:00:00`))) { setError("Enter a valid issue date."); return; }
    let credentialUrl: string | null; let imageUrl: string | null; let fileUrl: string | null;
    try {
      credentialUrl = optionalUrl(values.credential_url, "Credential URL");
      imageUrl = optionalUrl(values.certificate_image, "Certificate image URL");
      fileUrl = optionalUrl(values.certificate_file, "Certificate file URL");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the certificate URLs."); return; }
    const input: CertificateInput = { title: values.title.trim(), issuer: values.issuer.trim(), issue_date: values.issue_date || null, credential_url: credentialUrl, certificate_image: imageUrl, certificate_file: fileUrl, description: values.description.trim() || null, featured: values.featured, display_order: order };
    setSaving(true);
    try { await onSave(input); dialog.current?.close(); onClose(); }
    catch { setError("Unable to save this certificate. Check the details and try again."); }
    finally { setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="certificate-form-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === dialog.current) close(); }} className="m-auto max-h-[min(92vh,56rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
    <form onSubmit={submit} className="p-5 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">CERTIFICATES / EDITOR</p><h2 id="certificate-form-title" className="mt-2 font-serif text-2xl">{certificate ? "Edit certificate" : "Add certificate"}</h2></div><Button onClick={close} disabled={saving} size="small" aria-label="Close certificate form">Close</Button></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><FieldLabel htmlFor="certificate-title">Title *</FieldLabel><Input id="certificate-title" required value={values.title} onChange={(e) => update("title", e.target.value)} autoFocus /></div>
        <div><FieldLabel htmlFor="certificate-issuer">Issuer *</FieldLabel><Input id="certificate-issuer" required value={values.issuer} onChange={(e) => update("issuer", e.target.value)} /></div>
        <div><FieldLabel htmlFor="certificate-date">Issue date</FieldLabel><Input id="certificate-date" type="date" value={values.issue_date} onChange={(e) => update("issue_date", e.target.value)} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="certificate-credential">Credential URL</FieldLabel><Input id="certificate-credential" type="url" inputMode="url" placeholder="https://…" value={values.credential_url} onChange={(e) => update("credential_url", e.target.value)} /></div>
        <div className="sm:col-span-2"><ImageUploadField id="certificate-image" label="Certificate image" value={values.certificate_image} disabled={saving} onChange={(value) => update("certificate_image", value)} onUploadingChange={setUploadingImage} /></div>
        <div className="sm:col-span-2"><FieldLabel htmlFor="certificate-file">Certificate file URL</FieldLabel><Input id="certificate-file" type="url" inputMode="url" placeholder="https://…" value={values.certificate_file} onChange={(e) => update("certificate_file", e.target.value)} /></div>
        <div><FieldLabel htmlFor="certificate-order">Display order</FieldLabel><Input id="certificate-order" type="number" step="1" value={values.display_order} onChange={(e) => update("display_order", e.target.value)} /></div>
        <label className="flex min-h-11 items-center gap-3 self-end text-sm text-ink-secondary"><input type="checkbox" checked={values.featured} onChange={(e) => update("featured", e.target.checked)} className="size-4 accent-[var(--color-accent)]" />Feature this certificate</label>
        <div className="sm:col-span-2"><FieldLabel htmlFor="certificate-description">Description</FieldLabel><Textarea id="certificate-description" value={values.description} onChange={(e) => update("description", e.target.value)} /></div>
      </div>
      {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row"><Button onClick={close} disabled={saving || uploadingImage}>Cancel</Button><Button type="submit" variant="primary" disabled={saving || uploadingImage}>{saving ? "Saving…" : certificate ? "Save changes" : "Create certificate"}</Button></div>
    </form>
  </dialog>;
}
