"use client";

import { useState } from "react";
import { ArrowUpRight, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { CertificateForm } from "@/components/admin/certificates/certificate-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { CertificateApiError, createCertificate, deleteCertificate, listCertificates, updateCertificate, type Certificate, type CertificateInput } from "@/lib/api/certificates";

type Props = { initialCertificates: Certificate[] | null };
function ordered(items: Certificate[]) { return [...items].sort((a, b) => a.display_order - b.display_order || a.id - b.id); }
function date(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(parsed);
}

export function CertificatesManager({ initialCertificates }: Props) {
  const [items, setItems] = useState<Certificate[] | null>(initialCertificates);
  const [loadError, setLoadError] = useState(initialCertificates === null);
  const [editing, setEditing] = useState<Certificate | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Certificate | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function reload() { setLoadError(false); try { setItems(ordered(await listCertificates())); } catch { setLoadError(true); } }
  async function save(input: CertificateInput) {
    const target = editing;
    const saved = target ? await updateCertificate(target.id, input) : await createCertificate(input);
    setItems((current) => ordered([...(current ?? []).filter((item) => item.id !== saved.id), saved]));
    setEditing(undefined); setFeedback(target ? "Certificate updated." : "Certificate created."); setActionError(null);
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true); setActionError(null);
    try { await deleteCertificate(deleting.id); setItems((current) => (current ?? []).filter((item) => item.id !== deleting.id)); setDeleting(null); setFeedback("Certificate deleted."); }
    catch (cause) { setActionError(cause instanceof CertificateApiError && cause.code === "not_found" ? "This certificate was already removed. Refresh the list." : "Unable to delete this certificate. Please try again."); }
    finally { setBusy(false); }
  }

  const header = <PageHeader eyebrow="CONTENT / CERTIFICATES" title="Certificates" description="Manage certificate records, featured visibility, and archive order." actions={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={16} />Add Certificate</Button>} />;
  if (items === null && loadError) return <>{header}<ErrorState title="Certificates are currently unavailable." description="Check the API connection and try loading the certificates again." action={<Button onClick={() => void reload()}>Retry</Button>} /></>;
  if (items === null) return <>{header}<LoadingState title="Loading certificates" description="Fetching records from the portfolio API." /></>;

  return <div>{header}
    {feedback ? <p role="status" className="mb-5 border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {loadError ? <p role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">Could not refresh the list. Showing the last available records.<Button size="small" onClick={() => void reload()}>Retry</Button></p> : null}
    {items.length === 0 ? <EmptyState title="No certificates have been added yet." description="Add a certificate to manage your public credentials archive." action={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={16} />Add Certificate</Button>} /> :
      <div className="border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-ink-muted sm:px-5"><span>{items.length} {items.length === 1 ? "certificate" : "certificates"}</span><span>Ordered by display order</span></div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="hidden bg-canvas text-ink-muted lg:table-header-group [&_th]:border-b [&_th]:border-border [&_th]:px-4 [&_th]:py-3 [&_th]:font-mono [&_th]:text-[0.62rem] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.06em]"><tr><th>Certificate</th><th>Issue date</th><th>Featured</th><th>Order</th><th>References</th><th className="text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id}>
            <td className="px-4 py-4 lg:px-5"><div className="flex min-w-0 items-start gap-3">
              {item.certificate_image ? <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.certificate_image} alt="" loading="lazy" className="h-full w-full object-cover" />
              </span> : <span className="flex h-14 w-20 shrink-0 items-center justify-center border border-border bg-canvas text-ink-muted"><FileText size={20} /></span>}
              <div className="min-w-0"><p className="break-words font-medium text-ink">{item.title}</p><p className="break-words text-ink-secondary">{item.issuer || "Issuer not provided"}</p><p className="mt-1 text-xs text-ink-muted lg:hidden">{item.issue_date ? date(item.issue_date) : "No issue date"}</p><div className="mt-2 flex flex-wrap gap-2 lg:hidden">{item.featured ? <Badge tone="accent">Featured</Badge> : null}<span className="text-xs text-ink-muted">Order {item.display_order}</span></div></div></div></td>
            <td className="hidden whitespace-nowrap px-4 py-4 text-ink-muted lg:table-cell">{item.issue_date ? date(item.issue_date) : "—"}</td>
            <td className="hidden px-4 py-4 lg:table-cell">{item.featured ? <Badge tone="accent">Featured</Badge> : <span className="text-ink-muted">—</span>}</td>
            <td className="hidden px-4 py-4 font-mono tabular-nums text-ink-secondary lg:table-cell">{item.display_order}</td>
            <td className="hidden px-4 py-4 lg:table-cell"><div className="flex flex-wrap gap-3 text-xs text-ink-muted">{item.credential_url ? <a href={item.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">Credential <ArrowUpRight size={13} /></a> : null}{item.certificate_file ? <a href={item.certificate_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">PDF/file <ArrowUpRight size={13} /></a> : null}{!item.credential_url && !item.certificate_file ? "—" : null}</div></td>
            <td className="px-4 py-3 lg:text-right"><div className="flex flex-wrap gap-1 lg:justify-end"><Button size="small" variant="ghost" onClick={() => setEditing(item)} aria-label={`Edit ${item.title}`}><Pencil size={14} />Edit</Button><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => { setActionError(null); setDeleting(item); }} aria-label={`Delete ${item.title}`}><Trash2 size={14} />Delete</Button></div></td>
          </tr>)}</tbody>
        </table>
        {items.some((item) => item.credential_url || item.certificate_file) ? <ul className="space-y-1 border-t border-border px-4 py-3 text-xs text-ink-muted lg:hidden">{items.filter((item) => item.credential_url || item.certificate_file).map((item) => <li key={item.id} className="flex flex-wrap gap-x-3"><span className="w-full truncate text-ink-secondary">{item.title}</span>{item.credential_url ? <a href={item.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">Credential <ArrowUpRight size={12} /></a> : null}{item.certificate_file ? <a href={item.certificate_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">PDF/file <ArrowUpRight size={12} /></a> : null}</li>)}</ul> : null}
      </div>}
    {editing !== undefined ? <CertificateForm certificate={editing} onSave={save} onClose={() => setEditing(undefined)} /> : null}
    {deleting ? <ConfirmDialog title="Delete this certificate?" message={`${deleting.title} will be permanently removed.`} error={actionError} busy={busy} confirmLabel="Delete certificate" onCancel={() => setDeleting(null)} onConfirm={() => void remove()} /> : null}
  </div>;
}
