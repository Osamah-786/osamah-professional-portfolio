"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/form-controls";
import { MAX_ADMIN_UPLOAD_SIZE_BYTES, MediaApiError, uploadMedia } from "@/lib/api/media";

const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type Props = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onUploadingChange: (uploading: boolean) => void;
};

function uploadErrorMessage(error: unknown): string {
  if (error instanceof MediaApiError) {
    if (error.code === "unauthorized") return "Your session may have expired. Sign in again before uploading.";
    if (error.code === "validation") return "The image was rejected. Check the file type, contents, and 4 MB size limit.";
    if (error.code === "not_found") return "The media upload route is unavailable. Contact an administrator.";
  }
  return "Image upload failed. Check media storage availability and try again.";
}

export function ImageUploadField({ id, label, value, disabled = false, onChange, onUploadingChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    setError(null);
    if (!file) return;

    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!IMAGE_TYPES[extension] || file.type !== IMAGE_TYPES[extension]) {
      setError("Choose a JPG, JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size === 0) {
      setError("The selected image is empty.");
      return;
    }
    if (file.size > MAX_ADMIN_UPLOAD_SIZE_BYTES) {
      setError("Images must be 4 MB or smaller.");
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    try {
      const uploaded = await uploadMedia(file, "");
      onChange(uploaded.file_url);
      setPreviewFailed(false);
    } catch (cause) {
      setError(uploadErrorMessage(cause));
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  function removeImage() {
    onChange("");
    setError(null);
    setPreviewFailed(false);
  }

  return (
    <section className="space-y-3 border border-border bg-surface p-4" aria-busy={uploading}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={`Choose ${label.toLowerCase()}`}
        aria-describedby={`${id}-help`}
        disabled={disabled || uploading}
        onChange={(event) => void handleFileChange(event)}
      />
      {value && !previewFailed ? (
        <div className="flex min-h-28 items-center justify-center overflow-hidden border border-border bg-canvas p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`${label} preview`} onError={() => setPreviewFailed(true)} className="max-h-48 max-w-full object-contain" />
        </div>
      ) : value ? (
        <p className="border border-border bg-canvas px-3 py-4 text-sm text-ink-muted">The current image preview could not be loaded.</p>
      ) : (
        <p className="border border-border bg-canvas px-3 py-4 text-sm text-ink-muted">No image selected.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload Image"}
        </Button>
        {value ? <Button variant="ghost" disabled={disabled || uploading} onClick={removeImage}>Remove image</Button> : null}
      </div>
      <p id={`${id}-help`} className="text-xs text-ink-muted">JPG, JPEG, PNG, or WEBP · up to 4 MB</p>
      {uploading ? <p role="status" className="text-sm text-ink-secondary">Uploading image…</p> : null}
      {error ? <p role="alert" className="border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
    </section>
  );
}
