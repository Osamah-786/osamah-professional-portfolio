"use client";

import { useState } from "react";
import { ArrowUpRight, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { AchievementForm } from "@/components/admin/content/achievement-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { AchievementApiError, createAchievement, deleteAchievement, listAchievements, updateAchievement, type Achievement, type AchievementInput } from "@/lib/api/achievements";

type Props = { initialAchievements: Achievement[] | null };

function sort(items: Achievement[]) { return [...items].sort((left, right) => left.display_order - right.display_order || left.id - right.id); }
function formatDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed);
}

function AchievementImage({ achievement }: { achievement: Achievement }) {
  const [failed, setFailed] = useState(false);
  if (!achievement.image || failed) return <span className="flex size-14 shrink-0 items-center justify-center border border-border bg-canvas text-ink-muted"><ImageIcon size={18} aria-hidden="true" /></span>;
  return <span className="block size-14 shrink-0 overflow-hidden border border-border bg-canvas">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={achievement.image} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
  </span>;
}

export function AchievementsManager({ initialAchievements }: Props) {
  const [items, setItems] = useState<Achievement[] | null>(initialAchievements);
  const [loadError, setLoadError] = useState(initialAchievements === null);
  const [editing, setEditing] = useState<Achievement | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function reload() { setLoadError(false); try { setItems(sort(await listAchievements())); } catch { setLoadError(true); } }
  async function save(input: AchievementInput) {
    const target = editing;
    const saved = target ? await updateAchievement(target.id, input) : await createAchievement(input);
    setItems((current) => sort([...(current ?? []).filter((item) => item.id !== saved.id), saved]));
    setEditing(undefined); setFeedback(target ? "Achievement updated." : "Achievement created.");
  }
  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true); setDeleteError(null);
    try { await deleteAchievement(deleting.id); setItems((current) => (current ?? []).filter((item) => item.id !== deleting.id)); setDeleting(null); setFeedback("Achievement deleted."); }
    catch (cause) { setDeleteError(cause instanceof AchievementApiError && cause.code === "not_found" ? "This achievement was already removed. Reload the list." : "Unable to delete this achievement right now. Please try again."); }
    finally { setDeletingBusy(false); }
  }

  const header = <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-ink-muted">Manage achievement records, featured visibility, and display order.</p><Button variant="primary" onClick={() => { setFeedback(null); setEditing(null); }}><Plus size={15} />Add Achievement</Button></div>;
  if (items === null && loadError) return <>{header}<ErrorState title="Achievements are currently unavailable." description="Check the API connection and try loading achievements again." action={<Button onClick={() => void reload()}>Retry</Button>} /></>;
  if (items === null) return <>{header}<LoadingState title="Loading achievements" description="Fetching achievements from the portfolio API." /></>;

  return <div>
    {header}
    {feedback ? <p role="status" className="mb-4 border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {loadError ? <p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">The list could not be refreshed. Showing the last available data.<Button size="small" onClick={() => void reload()}>Retry</Button></p> : null}
    {items.length === 0 ? <EmptyState title="No achievements have been added yet." description="Add an achievement to manage the public portfolio content." action={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={15} />Add Achievement</Button>} /> :
      <div className="border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-ink-muted sm:px-5"><span>{items.length} {items.length === 1 ? "achievement" : "achievements"}</span><span>Ordered by display order</span></div>
        <ul className="divide-y divide-border">{sort(items).map((item) => <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:px-5"><AchievementImage key={item.image ?? "empty"} achievement={item} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start gap-x-3 gap-y-1"><h3 className="min-w-0 flex-1 break-words font-medium text-ink">{item.title}</h3>{item.featured ? <Badge tone="accent">Featured</Badge> : null}</div><p className="mt-1 break-words text-sm leading-5 text-ink-muted">{item.short_description || item.description || "No description"}</p><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">{item.date ? <span>{formatDate(item.date)}</span> : null}<span>Order {item.display_order}</span>{item.link ? <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">Open link <ArrowUpRight size={12} /></a> : null}</div></div><div className="flex shrink-0 gap-1"><Button size="small" variant="ghost" onClick={() => { setFeedback(null); setEditing(item); }} aria-label={`Edit ${item.title}`}><Pencil size={14} />Edit</Button><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => { setDeleteError(null); setDeleting(item); }} aria-label={`Delete ${item.title}`}><Trash2 size={14} />Delete</Button></div></li>)}</ul>
      </div>}
    {editing !== undefined ? <AchievementForm achievement={editing} onSave={save} onClose={() => setEditing(undefined)} /> : null}
    {deleting ? <ConfirmDialog title="Delete this achievement?" message={`${deleting.title} will be permanently removed.`} error={deleteError} busy={deletingBusy} confirmLabel="Delete achievement" onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} /> : null}
  </div>;
}
