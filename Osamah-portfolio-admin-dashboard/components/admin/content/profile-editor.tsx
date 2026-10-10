"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/form-controls";
import { ErrorState, LoadingState } from "@/components/ui/state-panel";
import { ProfileApiError, getProfile, updateProfile, type Profile, type ProfileInput } from "@/lib/api/profile";
import { MAX_ADMIN_UPLOAD_SIZE_BYTES, MediaApiError, uploadMedia } from "@/lib/api/media";

type Props = { initialProfile: Profile | null; initialError: "not_found" | "unavailable" | null };
type Values = {
  name: string;
  headline: string;
  short_bio: string;
  full_bio: string;
  profile_image: string;
  location: string;
  email: string;
  resume_url: string;
};
type AssetField = "profile_image" | "resume_url";
type AssetKind = "image" | "resume";
type AssetInput = {
  field: AssetField;
  kind: AssetKind;
  label: string;
  accept: string;
  inputId: string;
};

const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function valuesFrom(profile: Profile): Values {
  return {
    name: profile.name,
    headline: profile.headline ?? "",
    short_bio: profile.short_bio ?? "",
    full_bio: profile.full_bio ?? "",
    profile_image: profile.profile_image ?? "",
    location: profile.location ?? "",
    email: profile.email ?? "",
    resume_url: profile.resume_url ?? "",
  };
}

function optionalUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return trimmed;
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
}

function fileValidationError(file: File, kind: AssetKind): string | null {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf(".")).trim();
  const expectedType = kind === "image" ? IMAGE_TYPES[extension] : extension === ".pdf" ? "application/pdf" : null;
  const allowedTypes = kind === "image" ? "JPG, JPEG, PNG, or WEBP" : "PDF";
  if (!expectedType || file.type !== expectedType) return `Choose a valid ${allowedTypes} file.`;
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_ADMIN_UPLOAD_SIZE_BYTES) return "Files must be 4 MB or smaller.";
  return null;
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof MediaApiError) {
    if (error.code === "unauthorized") return "Your session may have expired. Sign in again before uploading.";
    if (error.code === "validation") return "The file was rejected. Check its type, contents, and 4 MB size limit.";
    if (error.code === "not_found") return "The media upload route is unavailable. Contact an administrator.";
  }
  return "Upload failed because the connection or media service is unavailable. Try again.";
}

function filenameFromUrl(value: string, fallback: string): string {
  try {
    const finalSegment = new URL(value).pathname.split("/").pop();
    return finalSegment ? decodeURIComponent(finalSegment) : fallback;
  } catch {
    return fallback;
  }
}

export function ProfileEditor({ initialProfile, initialError }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [loadError, setLoadError] = useState(initialProfile ? null : initialError ?? "unavailable");
  const [values, setValues] = useState<Values | null>(initialProfile ? () => valuesFrom(initialProfile) : null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<AssetField | null>(null);
  const [uploadingFilename, setUploadingFilename] = useState<string | null>(null);
  const [assetNames, setAssetNames] = useState<Partial<Record<AssetField, string>>>({});
  const [uploadError, setUploadError] = useState<{ field: AssetField; message: string } | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const uploadInProgressRef = useRef(false);

  async function reload() {
    setLoadError(null);
    try {
      const loaded = await getProfile();
      setProfile(loaded);
      setValues(valuesFrom(loaded));
    } catch (cause) {
      setLoadError(cause instanceof ProfileApiError && cause.code === "not_found" ? "not_found" : "unavailable");
    }
  }

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setFeedback(null);
    setUploadFeedback(null);
    setFormError(null);
  }

  async function uploadAsset(field: AssetField, kind: AssetKind, file: File) {
    const validationMessage = fileValidationError(file, kind);
    if (validationMessage) {
      setUploadError({ field, message: validationMessage });
      setUploadFeedback(null);
      return;
    }

    if (uploadInProgressRef.current || uploading || saving) return;
    uploadInProgressRef.current = true;
    setUploading(field);
    setUploadingFilename(file.name);
    setUploadError(null);
    setUploadFeedback(null);
    setFormError(null);
    try {
      const uploaded = await uploadMedia(file, field === "profile_image" ? values?.name ?? "" : "");
      update(field, uploaded.file_url);
      setAssetNames((current) => ({ ...current, [field]: file.name }));
      if (field === "profile_image") setImagePreviewFailed(false);
      setUploadFeedback(`${kind === "image" ? "Profile image" : "Resume"} uploaded. Save profile to apply the change.`);
    } catch (cause) {
      setUploadError({ field, message: uploadErrorMessage(cause) });
    } finally {
      uploadInProgressRef.current = false;
      setUploading(null);
      setUploadingFilename(null);
    }
  }

  function handleFileChange(field: AssetField, kind: AssetKind, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void uploadAsset(field, kind, file);
  }

  function removeAsset(field: AssetField, kind: AssetKind) {
    update(field, "");
    setAssetNames((current) => ({ ...current, [field]: undefined }));
    setUploadError(null);
    if (field === "profile_image") setImagePreviewFailed(false);
    setUploadFeedback(`${kind === "image" ? "Profile image" : "Resume"} removed from the profile draft. Save profile to apply the change.`);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || saving || uploading) return;
    setFormError(null);
    setFeedback(null);
    if (!values.name.trim()) { setFormError("Name is required."); return; }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) { setFormError("Enter a valid email address."); return; }
    let profileImage: string | null;
    let resumeUrl: string | null;
    try {
      profileImage = optionalUrl(values.profile_image, "Profile image");
      resumeUrl = optionalUrl(values.resume_url, "Resume");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Check the uploaded files and try again.");
      return;
    }
    const input: ProfileInput = {
      name: values.name.trim(),
      headline: values.headline.trim() || null,
      short_bio: values.short_bio.trim() || null,
      full_bio: values.full_bio.trim() || null,
      profile_image: profileImage,
      location: values.location.trim() || null,
      email: values.email.trim() || null,
      resume_url: resumeUrl,
    };
    setSaving(true);
    try {
      const updated = await updateProfile(input);
      setProfile(updated);
      setValues(valuesFrom(updated));
      setFeedback("Profile saved successfully.");
      setUploadFeedback(null);
    } catch (cause) {
      if (cause instanceof ProfileApiError && cause.code === "not_found") {
        setLoadError("not_found");
        setProfile(null);
        setValues(null);
      } else if (cause instanceof ProfileApiError && cause.code === "validation") {
        setFormError("Check the profile values and try again.");
      } else if (cause instanceof ProfileApiError && cause.code === "unauthorized") {
        setFormError("Your session may have expired. Sign in again to save the profile.");
      } else {
        setFormError("Profile could not be saved. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!values || !profile) {
    const missing = loadError === "not_found";
    return <div>
      {missing ? <ErrorState title="Profile information is currently unavailable." description="The backend has no profile record. This editor updates the existing singleton profile and cannot create one." action={<Button onClick={() => void reload()}>Retry</Button>} /> :
        loadError ? <ErrorState title="Profile information is currently unavailable." description="Check the API connection and try loading the profile again." action={<Button onClick={() => void reload()}>Retry</Button>} /> :
          <LoadingState title="Loading profile" description="Fetching the profile from the portfolio API." />}
    </div>;
  }

  const imageAsset: AssetInput = {
    field: "profile_image",
    kind: "image",
    label: "Profile image",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    inputId: "profile-image-file",
  };
  const resumeAsset: AssetInput = {
    field: "resume_url",
    kind: "resume",
    label: "Resume",
    accept: ".pdf,application/pdf",
    inputId: "profile-resume-file",
  };

  return <form onSubmit={save} className="space-y-5">
    {feedback ? <p role="status" className="border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {uploadFeedback ? <p role="status" className="border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{uploadFeedback}</p> : null}
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><FieldLabel htmlFor="profile-name">Name *</FieldLabel><Input id="profile-name" required maxLength={150} value={values.name} onChange={(event) => update("name", event.target.value)} disabled={saving || uploading !== null} /></div>
      <div className="sm:col-span-2"><FieldLabel htmlFor="profile-headline">Headline</FieldLabel><Input id="profile-headline" maxLength={255} value={values.headline} onChange={(event) => update("headline", event.target.value)} disabled={saving || uploading !== null} /></div>
      <div className="sm:col-span-2"><FieldLabel htmlFor="profile-short-bio">Short bio</FieldLabel><Textarea id="profile-short-bio" maxLength={500} value={values.short_bio} onChange={(event) => update("short_bio", event.target.value)} disabled={saving || uploading !== null} /></div>
      <div className="sm:col-span-2"><FieldLabel htmlFor="profile-full-bio">Full bio</FieldLabel><Textarea id="profile-full-bio" className="min-h-40" value={values.full_bio} onChange={(event) => update("full_bio", event.target.value)} disabled={saving || uploading !== null} /></div>
      <ProfileAssetControl
        asset={imageAsset}
        value={values.profile_image}
        filename={assetNames.profile_image ?? (values.profile_image ? filenameFromUrl(values.profile_image, "Current image") : null)}
        uploading={uploading === imageAsset.field}
        uploadingFilename={uploading === imageAsset.field ? uploadingFilename : null}
        disabled={saving || uploading !== null}
        error={uploadError?.field === imageAsset.field ? uploadError.message : null}
        imagePreviewFailed={imagePreviewFailed}
        onFileChange={handleFileChange}
        onRemove={removeAsset}
        onImageError={() => setImagePreviewFailed(true)}
      />
      <div><FieldLabel htmlFor="profile-location">Location</FieldLabel><Input id="profile-location" maxLength={255} value={values.location} onChange={(event) => update("location", event.target.value)} disabled={saving || uploading !== null} /></div>
      <div><FieldLabel htmlFor="profile-email">Email</FieldLabel><Input id="profile-email" type="email" maxLength={320} autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} disabled={saving || uploading !== null} /></div>
      <ProfileAssetControl
        asset={resumeAsset}
        value={values.resume_url}
        filename={assetNames.resume_url ?? (values.resume_url ? filenameFromUrl(values.resume_url, "Current resume") : null)}
        uploading={uploading === resumeAsset.field}
        uploadingFilename={uploading === resumeAsset.field ? uploadingFilename : null}
        disabled={saving || uploading !== null}
        error={uploadError?.field === resumeAsset.field ? uploadError.message : null}
        onFileChange={handleFileChange}
        onRemove={removeAsset}
      />
    </div>
    {formError ? <p role="alert" className="border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{formError}</p> : null}
    <div className="flex justify-end border-t border-border pt-5"><Button type="submit" variant="primary" disabled={saving || uploading !== null}>{saving ? "Saving…" : "Save profile"}</Button></div>
  </form>;
}

function ProfileAssetControl({
  asset,
  value,
  filename,
  uploading,
  uploadingFilename,
  disabled,
  error,
  imagePreviewFailed = false,
  onFileChange,
  onRemove,
  onImageError,
}: {
  asset: AssetInput;
  value: string;
  filename: string | null;
  uploading: boolean;
  uploadingFilename: string | null;
  disabled: boolean;
  error: string | null;
  imagePreviewFailed?: boolean;
  onFileChange: (field: AssetField, kind: AssetKind, event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (field: AssetField, kind: AssetKind) => void;
  onImageError?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = Boolean(value);
  return <section className="sm:col-span-2 space-y-3 border border-border bg-surface p-4" aria-busy={uploading}>
    <FieldLabel htmlFor={asset.inputId}>{asset.label}</FieldLabel>
    <input
      ref={inputRef}
      id={asset.inputId}
      type="file"
      accept={asset.accept}
      disabled={disabled}
      className="sr-only"
      aria-label={`Choose ${asset.kind === "image" ? "profile image" : "resume"} file`}
      onChange={(event) => onFileChange(asset.field, asset.kind, event)}
    />
    {asset.kind === "image" && hasValue && !imagePreviewFailed ? <div className="flex min-h-32 items-center justify-center overflow-hidden border border-border bg-canvas p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value} alt="Current profile image preview" onError={onImageError} className="max-h-48 max-w-full object-contain" />
    </div> : null}
    {asset.kind === "image" && hasValue && imagePreviewFailed ? <p className="border border-border bg-canvas px-3 py-4 text-sm text-ink-muted">The current image preview could not be loaded.</p> : null}
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled={disabled} onClick={() => inputRef.current?.click()}>
        {uploading ? "Uploading…" : hasValue ? "Replace" : `Upload ${asset.kind === "image" ? "image" : "resume"}`}
      </Button>
      {hasValue ? <Button variant="ghost" disabled={disabled} onClick={() => onRemove(asset.field, asset.kind)}>Remove</Button> : null}
      {asset.kind === "resume" && hasValue ? <a href={value} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-3 text-sm text-accent underline-offset-4 hover:underline">View resume</a> : null}
    </div>
    <p className="text-xs text-ink-muted">{asset.kind === "image" ? "JPG, JPEG, PNG, or WEBP · up to 4 MB" : "PDF · up to 4 MB"}</p>
    {uploading ? <p role="status" className="text-sm text-ink-secondary">Uploading {uploadingFilename ?? asset.label.toLowerCase()}…</p> : null}
    {!uploading && filename ? <p className="break-all text-sm text-ink-secondary">Current file: {filename}</p> : null}
    {error ? <p role="alert" className="border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
  </section>;
}
