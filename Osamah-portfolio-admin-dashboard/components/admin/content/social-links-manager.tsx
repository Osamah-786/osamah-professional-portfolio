"use client";

import { useState } from "react";
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { SocialLinkForm } from "@/components/admin/content/social-link-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { SocialLinkApiError, createSocialLink, deleteSocialLink, listSocialLinks, updateSocialLink, type SocialLink, type SocialLinkInput } from "@/lib/api/social-links";

type Props = { initialSocialLinks: SocialLink[] | null };
function sort(items: SocialLink[]) { return [...items].sort((left, right) => left.display_order - right.display_order || left.id - right.id); }

export function SocialLinksManager({ initialSocialLinks }: Props) {
  const [items, setItems] = useState<SocialLink[] | null>(initialSocialLinks);
  const [loadError, setLoadError] = useState(initialSocialLinks === null);
  const [editing, setEditing] = useState<SocialLink | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<SocialLink | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function reload() { setLoadError(false); try { setItems(sort(await listSocialLinks())); } catch { setLoadError(true); } }
  async function save(input: SocialLinkInput) {
    const target = editing;
    const saved = target ? await updateSocialLink(target.id, input) : await createSocialLink(input);
    setItems((current) => sort([...(current ?? []).filter((item) => item.id !== saved.id), saved]));
    setEditing(undefined); setFeedback(target ? "Social link updated." : "Social link created.");
  }
  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true); setDeleteError(null);
    try { await deleteSocialLink(deleting.id); setItems((current) => (current ?? []).filter((item) => item.id !== deleting.id)); setDeleting(null); setFeedback("Social link deleted."); }
    catch (cause) { setDeleteError(cause instanceof SocialLinkApiError && cause.code === "not_found" ? "This social link was already removed. Reload the list." : "Unable to delete this social link right now. Please try again."); }
    finally { setDeletingBusy(false); }
  }

  const header = <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-ink-muted">Manage public profile links and their order.</p><Button variant="primary" onClick={() => { setFeedback(null); setEditing(null); }}><Plus size={15} />Add Social Link</Button></div>;
  if (items === null && loadError) return <>{header}<ErrorState title="Social links are currently unavailable." description="Check the API connection and try loading the links again." action={<Button onClick={() => void reload()}>Retry</Button>} /></>;
  if (items === null) return <>{header}<LoadingState title="Loading social links" description="Fetching links from the portfolio API." /></>;

  return <div>
    {header}
    {feedback ? <p role="status" className="mb-4 border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {loadError ? <p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">The list could not be refreshed. Showing the last available data.<Button size="small" onClick={() => void reload()}>Retry</Button></p> : null}
    {items.length === 0 ? <EmptyState title="No social links have been added yet." description="Add a link to manage the social destinations shown in the portfolio." action={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={15} />Add Social Link</Button>} /> :
      <div className="border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-ink-muted sm:px-5"><span>{items.length} {items.length === 1 ? "link" : "links"}</span><span>Ordered by display order</span></div>
        <ul className="divide-y divide-border">{sort(items).map((item) => <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h3 className="break-words font-medium text-ink">{item.platform}</h3><span className="font-mono text-xs text-ink-muted">Order {item.display_order}</span>{item.icon ? <a href={item.icon} target="_blank" rel="noreferrer" className="text-xs text-ink-muted hover:text-accent">Icon reference</a> : null}</div><a href={item.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-sm text-accent hover:underline">{item.url}<ArrowUpRight size={13} className="shrink-0" /></a></div><div className="flex shrink-0 gap-1"><Button size="small" variant="ghost" onClick={() => { setFeedback(null); setEditing(item); }} aria-label={`Edit ${item.platform} link`}><Pencil size={14} />Edit</Button><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => { setDeleteError(null); setDeleting(item); }} aria-label={`Delete ${item.platform} link`}><Trash2 size={14} />Delete</Button></div></li>)}</ul>
      </div>}
    {editing !== undefined ? <SocialLinkForm socialLink={editing} onSave={save} onClose={() => setEditing(undefined)} /> : null}
    {deleting ? <ConfirmDialog title="Delete this social link?" message={`${deleting.platform} will be permanently removed.`} error={deleteError} busy={deletingBusy} confirmLabel="Delete social link" onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} /> : null}
  </div>;
}
