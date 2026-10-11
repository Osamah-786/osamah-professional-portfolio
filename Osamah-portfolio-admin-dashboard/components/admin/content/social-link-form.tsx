"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImageUploadField } from "@/components/admin/content/image-upload-field";
import { SocialPlatformLogo } from "@/components/admin/content/social-platform-logo";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/form-controls";
import type { SocialLink, SocialLinkInput } from "@/lib/api/social-links";

type Props = { socialLink: SocialLink | null; onSave: (input: SocialLinkInput) => Promise<void>; onClose: () => void };
type LogoMode = "upload" | "url";

function validUrl(value: string, label: string, required: boolean): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return trimmed;
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
}

export function SocialLinkForm({ socialLink, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = useState(socialLink?.platform ?? "");
  const [url, setUrl] = useState(socialLink?.url ?? "");
  const [icon, setIcon] = useState(socialLink?.icon ?? "");
  const [logoMode, setLogoMode] = useState<LogoMode>("url");
  const [order, setOrder] = useState(String(socialLink?.display_order ?? 0));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  function close() {
    if (!saving && !uploading) {
      dialog.current?.close();
      onClose();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!platform.trim()) { setError("Platform is required."); return; }
    const displayOrder = Number(order);
    if (!Number.isSafeInteger(displayOrder)) { setError("Display order must be a whole number."); return; }

    let normalizedUrl: string | null;
    let iconUrl: string | null;
    try {
      normalizedUrl = validUrl(url, "Profile URL", true);
      iconUrl = validUrl(icon, "Logo image URL", false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check the social link values.");
      return;
    }
    if (!normalizedUrl) { setError("Profile URL is required."); return; }

    setSaving(true);
    try {
      await onSave({ platform: platform.trim(), url: normalizedUrl, icon: iconUrl, display_order: displayOrder });
      dialog.current?.close();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "validation" ? "Check the social link values and try again." : "Unable to save this social link right now.");
    } finally {
      setSaving(false);
    }
  }

  const disabled = saving || uploading;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="social-link-form-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialog.current) close(); }}
      className="m-auto w-[min(36rem,calc(100%-2rem))] border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80"
    >
      <form onSubmit={submit} className="p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">SOCIAL LINKS / EDITOR</p>
            <h3 id="social-link-form-title" className="mt-2 font-serif text-2xl">{socialLink ? "Edit social link" : "Add social link"}</h3>
          </div>
          <Button onClick={close} disabled={disabled} size="small">Close</Button>
        </div>

        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="social-link-platform">Platform *</FieldLabel>
            <Input id="social-link-platform" required maxLength={100} value={platform} onChange={(event) => setPlatform(event.target.value)} autoFocus disabled={disabled} />
          </div>
          <div>
            <FieldLabel htmlFor="social-link-url">Profile URL *</FieldLabel>
            <Input id="social-link-url" type="url" inputMode="url" required maxLength={2048} placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} disabled={disabled} />
            <p className="mt-1 text-xs text-ink-muted">Visitors will be sent to this profile link.</p>
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-xs font-medium tracking-wide text-ink-secondary">Logo source</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex min-h-11 items-center gap-2">
                <input type="radio" name="social-link-logo-mode" value="upload" checked={logoMode === "upload"} onChange={() => setLogoMode("upload")} disabled={disabled} />
                Upload image
              </label>
              <label className="inline-flex min-h-11 items-center gap-2">
                <input type="radio" name="social-link-logo-mode" value="url" checked={logoMode === "url"} onChange={() => setLogoMode("url")} disabled={disabled} />
                Enter image URL
              </label>
            </div>

            {logoMode === "upload" ? (
              <ImageUploadField
                id="social-link-icon-upload"
                label="Logo image"
                value={icon}
                disabled={saving}
                onChange={setIcon}
                onUploadingChange={setUploading}
              />
            ) : (
              <div>
                <FieldLabel htmlFor="social-link-icon">Logo image URL</FieldLabel>
                <Input
                  id="social-link-icon"
                  type="url"
                  inputMode="url"
                  maxLength={2048}
                  placeholder="https://example.com/logo.png"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                  disabled={disabled}
                />
                <div className="mt-3 flex items-center gap-3 border border-border bg-surface p-3">
                  <SocialPlatformLogo key={icon || "default"} platform={platform} src={icon.trim() || null} />
                  <p className="text-xs text-ink-muted">{icon.trim() ? "Logo preview" : "Default platform logo preview"}</p>
                </div>
              </div>
            )}
          </fieldset>

          <div>
            <FieldLabel htmlFor="social-link-order">Display order</FieldLabel>
            <Input id="social-link-order" type="number" step="1" value={order} onChange={(event) => setOrder(event.target.value)} disabled={disabled} />
          </div>
        </div>

        {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
        <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row">
          <Button onClick={close} disabled={disabled}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={disabled}>{saving ? "Saving…" : uploading ? "Uploading…" : socialLink ? "Save changes" : "Create social link"}</Button>
        </div>
      </form>
    </dialog>
  );
}
