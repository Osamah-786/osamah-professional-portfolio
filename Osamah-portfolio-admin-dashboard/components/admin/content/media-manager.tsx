"use client";

import { useState } from "react";
import { ArrowUpRight, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { MediaUploadForm } from "@/components/admin/content/media-upload-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { deleteMedia, listMedia, MediaApiError, uploadMedia, type Media } from "@/lib/api/media";

type Props = { initialMedia: Media[] | null };

function sort(items: Media[]) {
  return [...items].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at) || right.id - left.id);
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}

function fileTypeLabel(fileType: string) {
  if (fileType === "image/jpeg") return "JPEG";
  if (fileType === "image/png") return "PNG";
  if (fileType === "image/webp") return "WEBP";
  if (fileType === "application/pdf") return "PDF";
  return fileType;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed);
}

function MediaPreview({ item }: { item: Media }) {
  const [failed, setFailed] = useState(false);
  if (item.file_type === "application/pdf") {
    return <div className="flex h-40 items-center justify-center border-b border-border bg-canvas text-ink-muted"><FileText size={38} strokeWidth={1.25} aria-hidden="true" /><span className="sr-only">PDF document</span></div>;
  }
  const url = safeHttpUrl(item.file_url);
  if (!item.file_type.startsWith("image/") || !url || failed) {
    return <div className="flex h-40 items-center justify-center border-b border-border bg-canvas text-ink-muted"><ImageIcon size={30} strokeWidth={1.25} aria-hidden="true" /><span className="sr-only">Image preview unavailable</span></div>;
  }
  return <div className="flex h-40 items-center justify-center overflow-hidden border-b border-border bg-canvas">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={item.alt_text ?? ""} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" />
  </div>;
}

export function MediaManager({ initialMedia }: Props) {
  const [items, setItems] = useState<Media[] | null>(initialMedia);
  const [loadError, setLoadError] = useState(initialMedia === null);
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function reload() {
    setLoadError(false);
    try { setItems(sort(await listMedia())); }
    catch { setLoadError(true); }
  }

  async function upload(file: File, altText: string) {
    try {
      const uploaded = await uploadMedia(file, altText);
      if (items === null || loadError) {
        try { setItems(sort(await listMedia())); setLoadError(false); }
        catch { setItems((current) => sort([uploaded, ...(current ?? []).filter((item) => item.id !== uploaded.id)])); setLoadError(true); }
      } else {
        setItems((current) => sort([uploaded, ...(current ?? []).filter((item) => item.id !== uploaded.id)]));
      }
      setFeedback({ kind: "success", message: "Media uploaded successfully." });
      return uploaded;
    } catch (cause) {
      setFeedback({ kind: "error", message: "Media upload failed. Check the file and storage availability, then try again." });
      throw cause;
    }
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true); setDeleteError(null);
    try {
      await deleteMedia(deleting.id);
      setItems((current) => (current ?? []).filter((item) => item.id !== deleting.id));
      setDeleting(null); setFeedback({ kind: "success", message: "Media deleted successfully." });
    } catch (cause) {
      const code = cause instanceof MediaApiError ? cause.code : "unavailable";
      setDeleteError(code === "not_found" ? "This media record was already removed. Reload the library." : "Media deletion failed. The record is still shown; try again later.");
    } finally { setDeletingBusy(false); }
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-1"><p className="text-sm text-ink-muted">Upload and manage image and document references stored by the portfolio backend.</p></div>
    {feedback ? <p role={feedback.kind === "error" ? "alert" : "status"} className={`border px-4 py-3 text-sm ${feedback.kind === "success" ? "border-success/30 bg-success/10 text-success" : "border-error/30 bg-error/10 text-error"}`}>{feedback.message}</p> : null}
    <MediaUploadForm onUpload={upload} />

    <div className="flex items-center justify-between border-b border-border pb-3"><h3 className="font-serif text-lg text-ink">Media library</h3>{items ? <span className="text-xs text-ink-muted">{items.length} {items.length === 1 ? "file" : "files"}</span> : null}</div>
    {items === null && loadError ? <ErrorState title="Media is currently unavailable." description="Check the API connection and try loading the media library again." action={<Button onClick={() => void reload()}>Retry</Button>} /> :
      items === null ? <LoadingState title="Loading media..." description="Fetching media records from the portfolio API." /> :
        loadError ? <div><p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">The library could not be refreshed. Showing the last available media.<Button size="small" onClick={() => void reload()}>Retry</Button></p><MediaGrid items={items} onDelete={(item) => { setDeleteError(null); setDeleting(item); }} /></div> :
          items.length === 0 ? <EmptyState title="No media has been uploaded yet." description="Upload an image or PDF to add it to the media library." /> :
            <MediaGrid items={items} onDelete={(item) => { setDeleteError(null); setDeleting(item); }} />}

    {deleting ? <ConfirmDialog title="Delete this media file?" message="This removes the media record and asks Cloudinary to delete its resource where one exists. If Cloudinary deletion fails, the backend rejects the deletion and keeps the record." error={deleteError} busy={deletingBusy} confirmLabel="Delete media" onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} /> : null}
  </div>;
}

function MediaGrid({ items, onDelete }: { items: Media[]; onDelete: (item: Media) => void }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => {
    const url = safeHttpUrl(item.file_url);
    return <article key={item.id} className="min-w-0 border border-border bg-surface">
      <MediaPreview key={`${item.id}:${item.file_url}`} item={item} />
      <div className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[0.65rem] uppercase tracking-[0.06em] text-accent">{fileTypeLabel(item.file_type)}</span><time className="text-xs text-ink-muted" dateTime={item.created_at}>{formatDate(item.created_at)}</time></div>
        <div className="min-w-0"><p className="text-xs text-ink-muted">Alt text</p><p className="break-words text-sm text-ink-secondary">{item.alt_text || "Not provided"}</p></div>
        <div className="min-w-0"><p className="text-xs text-ink-muted">File reference</p>{url ? <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-xs text-accent hover:underline">Open file <ArrowUpRight size={12} className="shrink-0" /></a> : <p className="mt-1 break-all text-xs text-ink-muted">Unavailable URL</p>}</div>
        <div className="flex justify-end border-t border-border pt-3"><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => onDelete(item)} aria-label={`Delete media file ${item.id}`}><Trash2 size={14} />Delete</Button></div>
      </div>
    </article>;
  })}</div>;
}
