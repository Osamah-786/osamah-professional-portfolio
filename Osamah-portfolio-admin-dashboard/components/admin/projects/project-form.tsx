"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/form-controls";
import type { Project, ProjectInput } from "@/lib/api/projects";

type ProjectFormProps = {
  project: Project | null;
  onSave: (input: ProjectInput) => Promise<void>;
  onClose: () => void;
};

type FormValues = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  cover_image: string;
  github_url: string;
  live_url: string;
  featured: boolean;
  display_order: string;
};

function initialValues(project: Project | null): FormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    short_description: project?.short_description ?? "",
    description: project?.description ?? "",
    cover_image: project?.cover_image ?? "",
    github_url: project?.github_url ?? "",
    live_url: project?.live_url ?? "",
    featured: project?.featured ?? false,
    display_order: String(project?.display_order ?? 0),
  };
}

function optionalUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    return trimmed;
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
}

export function ProjectForm({ project, onSave, onClose }: ProjectFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(() => initialValues(project));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function close() {
    if (isSaving) return;
    dialogRef.current?.close();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const order = Number(values.display_order);
    if (!Number.isSafeInteger(order)) {
      setError("Display order must be a whole number.");
      return;
    }
    if (!values.title.trim() || !values.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    let input: ProjectInput;
    try {
      input = {
        title: values.title.trim(),
        slug: values.slug.trim(),
        short_description: values.short_description.trim() || null,
        description: values.description.trim() || null,
        cover_image: optionalUrl(values.cover_image, "Cover image"),
        github_url: optionalUrl(values.github_url, "GitHub URL"),
        live_url: optionalUrl(values.live_url, "Live URL"),
        featured: values.featured,
        display_order: order,
      };
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check the URLs and try again.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(input);
      dialogRef.current?.close();
      onClose();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "unavailable";
      setError(
        code === "slug_conflict"
          ? "This project slug is already in use."
          : code === "validation"
            ? "Check the project details and try again."
            : code === "not_found"
              ? "This project is no longer available. Refresh the list and try again."
              : "Unable to save this project right now. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="project-form-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialogRef.current) close(); }}
      className="m-auto max-h-[min(92vh,56rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80"
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">PROJECTS / EDITOR</p>
            <h2 id="project-form-title" className="mt-2 font-serif text-2xl">{project ? "Edit project" : "Add project"}</h2>
          </div>
          <Button type="button" variant="ghost" size="small" onClick={close} disabled={isSaving} aria-label="Close project form">Close</Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="project-title">Title <span aria-hidden="true">*</span></FieldLabel>
            <Input id="project-title" name="title" required value={values.title} onChange={(event) => update("title", event.target.value)} autoFocus />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="project-slug">Slug <span aria-hidden="true">*</span></FieldLabel>
            <Input id="project-slug" name="slug" required value={values.slug} onChange={(event) => update("slug", event.target.value)} aria-describedby="project-slug-help" />
            <p id="project-slug-help" className="mt-1 text-xs text-ink-muted">Used in the public project URL.</p>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="project-short-description">Short description</FieldLabel>
            <Textarea id="project-short-description" name="short_description" value={values.short_description} onChange={(event) => update("short_description", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="project-description">Description</FieldLabel>
            <Textarea id="project-description" name="description" className="min-h-40" value={values.description} onChange={(event) => update("description", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="project-cover-image">Cover image URL</FieldLabel>
            <Input id="project-cover-image" name="cover_image" type="url" inputMode="url" placeholder="https://…" value={values.cover_image} onChange={(event) => update("cover_image", event.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="project-github-url">GitHub URL</FieldLabel>
            <Input id="project-github-url" name="github_url" type="url" inputMode="url" placeholder="https://github.com/…" value={values.github_url} onChange={(event) => update("github_url", event.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="project-live-url">Live URL</FieldLabel>
            <Input id="project-live-url" name="live_url" type="url" inputMode="url" placeholder="https://…" value={values.live_url} onChange={(event) => update("live_url", event.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="project-display-order">Display order</FieldLabel>
            <Input id="project-display-order" name="display_order" type="number" step="1" value={values.display_order} onChange={(event) => update("display_order", event.target.value)} />
          </div>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm text-ink-secondary">
            <input type="checkbox" name="featured" checked={values.featured} onChange={(event) => update("featured", event.target.checked)} className="size-4 accent-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
            Feature this project
          </label>
        </div>

        {error ? <p role="alert" className="mt-5 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
        <div className="mt-7 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row">
          <Button type="button" onClick={close} disabled={isSaving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? "Saving…" : project ? "Save changes" : "Create project"}</Button>
        </div>
      </form>
    </dialog>
  );
}
