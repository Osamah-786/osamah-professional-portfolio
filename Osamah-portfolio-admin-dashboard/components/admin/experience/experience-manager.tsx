"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ExperienceForm } from "@/components/admin/experience/experience-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { ExperienceApiError, createExperience, deleteExperience, listExperience, updateExperience, type Experience, type ExperienceInput } from "@/lib/api/experience";

type Props = { initialExperience: Experience[] | null };
function ordered(items: Experience[]) { return [...items].sort((a, b) => a.display_order - b.display_order || a.id - b.id); }
function date(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(parsed);
}

export function ExperienceManager({ initialExperience }: Props) {
  const [items, setItems] = useState<Experience[] | null>(initialExperience);
  const [loadError, setLoadError] = useState(initialExperience === null);
  const [editing, setEditing] = useState<Experience | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Experience | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function reload() {
    setLoadError(false);
    try { setItems(ordered(await listExperience())); } catch { setLoadError(true); }
  }
  async function save(input: ExperienceInput) {
    const target = editing;
    const saved = target ? await updateExperience(target.id, input) : await createExperience(input);
    setItems((current) => ordered([...(current ?? []).filter((item) => item.id !== saved.id), saved]));
    setEditing(undefined); setFeedback(target ? "Experience updated." : "Experience created."); setActionError(null);
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true); setActionError(null);
    try { await deleteExperience(deleting.id); setItems((current) => (current ?? []).filter((item) => item.id !== deleting.id)); setDeleting(null); setFeedback("Experience deleted."); }
    catch (cause) { setActionError(cause instanceof ExperienceApiError && cause.code === "not_found" ? "This entry was already removed. Refresh the list." : "Unable to delete this experience entry. Please try again."); }
    finally { setBusy(false); }
  }

  const header = <PageHeader eyebrow="CONTENT / EXPERIENCE" title="Experience" description="Manage work history, featured visibility, and display order." actions={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={16} />Add Experience</Button>} />;
  if (items === null && loadError) return <>{header}<ErrorState title="Experience is currently unavailable." description="Check the API connection and try loading the entries again." action={<Button onClick={() => void reload()}>Retry</Button>} /></>;
  if (items === null) return <>{header}<LoadingState title="Loading experience" description="Fetching entries from the portfolio API." /></>;

  return <div>{header}
    {feedback ? <p role="status" className="mb-5 border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {loadError ? <p role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">Could not refresh the list. Showing the last available entries.<Button size="small" onClick={() => void reload()}>Retry</Button></p> : null}
    {items.length === 0 ? <EmptyState title="No experience entries have been added yet." description="Add an entry to manage your work history." action={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={16} />Add Experience</Button>} /> :
      <div className="border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-ink-muted sm:px-5"><span>{items.length} {items.length === 1 ? "entry" : "entries"}</span><span>Ordered by display order</span></div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="hidden bg-canvas text-ink-muted lg:table-header-group [&_th]:border-b [&_th]:border-border [&_th]:px-4 [&_th]:py-3 [&_th]:font-mono [&_th]:text-[0.62rem] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.06em]"><tr><th>Experience</th><th>Period</th><th>Featured</th><th>Order</th><th className="text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id}>
            <td className="px-4 py-4 lg:px-5"><div className="flex min-w-0 items-start gap-3">
              {item.company_logo ? <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-border bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.company_logo} alt="" loading="lazy" className="h-full w-full object-contain" />
              </span> : <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-canvas font-mono text-xs text-ink-muted">{item.company.slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0"><p className="break-words font-medium text-ink">{item.role}</p><p className="break-words text-ink-secondary">{item.company}{item.location ? ` · ${item.location}` : ""}</p><p className="mt-1 text-xs text-ink-muted lg:hidden">{date(item.start_date)} — {item.currently_working ? "Present" : item.end_date ? date(item.end_date) : "—"}</p><div className="mt-2 flex flex-wrap gap-2 lg:hidden">{item.featured ? <Badge tone="accent">Featured</Badge> : null}<span className="text-xs text-ink-muted">Order {item.display_order}</span></div>
              </div></div></td>
            <td className="hidden whitespace-nowrap px-4 py-4 text-ink-muted lg:table-cell">{date(item.start_date)} — {item.currently_working ? <Badge tone="success">Current</Badge> : item.end_date ? date(item.end_date) : "—"}</td>
            <td className="hidden px-4 py-4 lg:table-cell">{item.featured ? <Badge tone="accent">Featured</Badge> : <span className="text-ink-muted">—</span>}</td>
            <td className="hidden px-4 py-4 font-mono tabular-nums text-ink-secondary lg:table-cell">{item.display_order}</td>
            <td className="px-4 py-3 lg:text-right"><div className="flex flex-wrap gap-1 lg:justify-end"><Button size="small" variant="ghost" onClick={() => setEditing(item)} aria-label={`Edit ${item.role} at ${item.company}`}><Pencil size={14} />Edit</Button><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => { setActionError(null); setDeleting(item); }} aria-label={`Delete ${item.role} at ${item.company}`}><Trash2 size={14} />Delete</Button></div></td>
          </tr>)}</tbody>
        </table>
      </div>}
    {editing !== undefined ? <ExperienceForm experience={editing} onSave={save} onClose={() => setEditing(undefined)} /> : null}
    {deleting ? <ConfirmDialog title="Delete this experience entry?" message={`${deleting.role} · ${deleting.company} will be permanently removed.`} error={actionError} busy={busy} confirmLabel="Delete entry" onCancel={() => setDeleting(null)} onConfirm={() => void remove()} /> : null}
  </div>;
}
