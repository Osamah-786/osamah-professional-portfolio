"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/form-controls";
import { MAX_ADMIN_UPLOAD_SIZE_BYTES, type Media } from "@/lib/api/media";

const SUPPORTED_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

type Props = { onUpload: (file: File, altText: string) => Promise<Media> };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploadForm({ onUpload }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!file) { setError("Choose a file to upload."); return; }
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    const expectedMime = SUPPORTED_TYPES[extension];
    if (!expectedMime || file.type !== expectedMime || file.size === 0 || file.size > MAX_ADMIN_UPLOAD_SIZE_BYTES) {
      setError("File type or size is not supported."); return;
    }
    if (altText.length > 500) { setError("Alt text must be 500 characters or fewer."); return; }
    setUploading(true);
    try {
      await onUpload(file, altText.trim());
      setFile(null); setAltText("");
      formRef.current?.reset();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "unavailable";
      setError(code === "validation" ? "File type or size is not supported." : "Upload could not be completed. Check media storage availability and try again.");
    } finally { setUploading(false); }
  }

  return <form ref={formRef} onSubmit={submit} className="border border-border bg-surface p-4 sm:p-5">
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <div><FieldLabel htmlFor="media-file">Select file *</FieldLabel><Input id="media-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" disabled={uploading} aria-describedby="media-file-help" className="file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-accent" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); }} /><p id="media-file-help" className="mt-1 text-xs text-ink-muted">JPG, JPEG, PNG, WEBP, or PDF · up to 4 MB</p></div>
      <div><FieldLabel htmlFor="media-alt-text">Alt text <span className="text-ink-muted">(optional)</span></FieldLabel><Input id="media-alt-text" maxLength={500} value={altText} disabled={uploading} onChange={(event) => setAltText(event.target.value)} /></div>
      <Button type="submit" variant="primary" disabled={uploading || !file}>{uploading ? "Uploading…" : "Upload Media"}</Button>
    </div>
    {file ? <p className="mt-3 break-all text-xs text-ink-muted" role="status">Selected: <span className="text-ink-secondary">{file.name}</span> · {formatBytes(file.size)}</p> : null}
    {error ? <p role="alert" className="mt-4 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
  </form>;
}
