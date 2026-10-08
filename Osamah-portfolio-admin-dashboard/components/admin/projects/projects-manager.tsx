"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Github, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { ProjectApiError, createProject, deleteProject, listProjects, updateProject, type Project, type ProjectInput } from "@/lib/api/projects";
import { ProjectForm } from "@/components/admin/projects/project-form";

type ProjectsManagerProps = {
  initialProjects: Project[] | null;
};

function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => left.display_order - right.display_order || left.id - right.id);
}

function ProjectImage({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  if (!project.cover_image || failed) {
    return <span className="flex h-12 w-16 shrink-0 items-center justify-center border border-border bg-canvas font-mono text-[0.55rem] uppercase tracking-wide text-ink-muted">No image</span>;
  }
  return (
    <span className="block h-12 w-16 shrink-0 overflow-hidden border border-border bg-canvas">
      {/* Remote URL is supplied by the portfolio API; plain img avoids a host allowlist for arbitrary admin content. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={project.cover_image} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
    </span>
  );
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return (
    <>
      <tr className="hidden border-b border-border last:border-0 lg:table-row">
        <td className="px-4 py-3">
          <div className="flex min-w-56 items-center gap-3">
            <ProjectImage key={project.cover_image ?? "empty"} project={project} />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{project.title}</p>
              <p className="truncate font-mono text-xs text-ink-muted">/{project.slug}</p>
            </div>
          </div>
        </td>
        <td className="max-w-xs px-4 py-3 text-ink-muted"><p className="line-clamp-2">{project.short_description || "—"}</p></td>
        <td className="px-4 py-3">{project.featured ? <Badge tone="accent">Featured</Badge> : <span className="text-ink-muted">—</span>}</td>
        <td className="px-4 py-3 font-mono tabular-nums text-ink-secondary">{project.display_order}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 text-ink-muted" aria-label="Project links">
            {project.github_url ? <a href={project.github_url} target="_blank" rel="noreferrer" aria-label={`${project.title} GitHub`} className="inline-flex size-8 items-center justify-center border border-border hover:text-accent"><Github size={15} /></a> : <span className="text-xs">No GitHub</span>}
            {project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer" aria-label={`${project.title} live site`} className="inline-flex size-8 items-center justify-center border border-border hover:text-accent"><ArrowUpRight size={15} /></a> : <span className="text-xs">No live URL</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="small" onClick={() => onEdit(project)} aria-label={`Edit ${project.title}`}><Pencil size={14} />Edit</Button>
            <Button variant="ghost" size="small" className="text-error hover:text-error" onClick={() => onDelete(project)} aria-label={`Delete ${project.title}`}><Trash2 size={14} />Delete</Button>
          </div>
        </td>
      </tr>

      <tr className="border-b border-border last:border-0 lg:hidden">
        <td colSpan={6} className="p-0">
        <div className="flex items-start gap-3 p-4">
          <ProjectImage key={project.cover_image ?? "empty"} project={project} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words font-medium text-ink">{project.title}</p>
                <p className="break-all font-mono text-xs text-ink-muted">/{project.slug}</p>
              </div>
              {project.featured ? <Badge tone="accent">Featured</Badge> : null}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{project.short_description || "No short description"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>Order {project.display_order}</span>
              <span aria-hidden="true">·</span>
              {project.github_url ? <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent"><Github size={13} /> GitHub</a> : <span>No GitHub</span>}
              <span aria-hidden="true">·</span>
              {project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent"><ArrowUpRight size={13} /> Live site</a> : <span>No live URL</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="small" onClick={() => onEdit(project)} aria-label={`Edit ${project.title}`}><Pencil size={14} />Edit</Button>
              <Button variant="ghost" size="small" className="text-error hover:text-error" onClick={() => onDelete(project)} aria-label={`Delete ${project.title}`}><Trash2 size={14} />Delete</Button>
            </div>
          </div>
        </div>
        </td>
      </tr>
    </>
  );
}

function DeleteProjectDialog({
  project,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  project: Project;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="delete-project-title" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} className="m-auto w-[min(28rem,calc(100%-2rem))] border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
      <div className="p-5 sm:p-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-error">PERMANENT ACTION</p>
        <h2 id="delete-project-title" className="mt-2 font-serif text-2xl">Delete this project?</h2>
        <p className="mt-3 text-sm leading-6 text-ink-muted"><span className="font-medium text-ink">{project.title}</span> will be permanently removed. This action cannot be undone.</p>
        {error ? <p role="alert" className="mt-4 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row">
          <Button onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}><Trash2 size={14} />{busy ? "Deleting…" : "Delete project"}</Button>
        </div>
      </div>
    </dialog>
  );
}

export function ProjectsManager({ initialProjects }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<Project[] | null>(initialProjects);
  const [loadError, setLoadError] = useState(initialProjects === null);
  const [editing, setEditing] = useState<Project | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function reload() {
    setLoadError(false);
    try {
      setProjects(sortProjects(await listProjects()));
    } catch {
      setLoadError(true);
    }
  }

  async function save(input: ProjectInput) {
    const saved = editing ? await updateProject(editing.id, input) : await createProject(input);
    setProjects((current) => sortProjects([...(current ?? []).filter((project) => project.id !== saved.id), saved]));
    setEditing(undefined);
    setFeedback({ kind: "success", message: editing ? "Project updated." : "Project created." });
    void reload();
  }

  async function confirmDelete() {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(deleting.id);
      setProjects((current) => (current ?? []).filter((project) => project.id !== deleting.id));
      setDeleting(null);
      setFeedback({ kind: "success", message: "Project deleted." });
    } catch (cause) {
      setDeleteError(cause instanceof ProjectApiError && cause.code === "not_found" ? "This project was already removed. Refresh the list." : "Unable to delete this project right now. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const pageHeader = (
    <PageHeader
      eyebrow="CONTENT / PROJECTS"
      title="Projects"
      description="Manage the projects presented in the public portfolio. Control featured visibility and display order."
      actions={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={16} />Add Project</Button>}
    />
  );

  if (projects === null && loadError) {
    return <>{pageHeader}<ErrorState title="Projects are currently unavailable." description="Check the API connection and try loading the project list again." action={<Button onClick={() => void reload()}>Retry</Button>} /></>;
  }
  if (projects === null) return <>{pageHeader}<LoadingState title="Loading projects" description="Fetching project records from the portfolio API." /></>;

  return (
    <div>
      {pageHeader}
      {feedback ? <p role={feedback.kind === "error" ? "alert" : "status"} className={`mb-5 border px-4 py-3 text-sm ${feedback.kind === "success" ? "border-success/30 bg-success/10 text-success" : "border-error/30 bg-error/10 text-error"}`}>{feedback.message}</p> : null}
      {loadError ? <p role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">The list could not be refreshed. The last saved changes are shown. <Button size="small" onClick={() => void reload()}>Retry</Button></p> : null}
      {projects.length === 0 ? (
        <EmptyState title="No projects have been added yet." description="Add a project to begin managing the work shown in your public portfolio." action={<Button variant="primary" onClick={() => setEditing(null)}><Plus size={16} />Add Project</Button>} />
      ) : (
        <div className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-ink-muted sm:px-5">
            <span>{projects.length} {projects.length === 1 ? "project" : "projects"}</span>
            <span>Ordered by display order</span>
          </div>
          <table className="w-full border-collapse text-left text-sm">
            <thead className="hidden bg-canvas text-ink-muted lg:table-header-group [&_th]:border-b [&_th]:border-border [&_th]:px-4 [&_th]:py-3 [&_th]:font-mono [&_th]:text-[0.62rem] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.06em]">
              <tr><th scope="col">Project</th><th scope="col">Summary</th><th scope="col">Featured</th><th scope="col">Order</th><th scope="col">Links</th><th scope="col" className="text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => <ProjectRow key={project.id} project={project} onEdit={setEditing} onDelete={(item) => { setDeleteError(null); setDeleting(item); }} />)}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined ? <ProjectForm project={editing} onSave={save} onClose={() => setEditing(undefined)} /> : null}
      {deleting ? <DeleteProjectDialog project={deleting} busy={isDeleting} error={deleteError} onCancel={() => { if (!isDeleting) setDeleting(null); }} onConfirm={() => void confirmDelete()} /> : null}
    </div>
  );
}
