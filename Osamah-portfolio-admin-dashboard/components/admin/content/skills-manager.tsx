"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CategoryForm } from "@/components/admin/content/category-form";
import { SkillForm } from "@/components/admin/content/skill-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-panel";
import { SkillApiError, createSkill, createSkillCategory, deleteSkill, deleteSkillCategory, listSkillCategories, listSkills, updateSkill, updateSkillCategory, type Skill, type SkillCategory, type SkillCategoryInput, type SkillInput } from "@/lib/api/skills";

type Props = { initialCategories: SkillCategory[] | null; initialSkills: Skill[] | null };
type DeleteTarget = { type: "category"; item: SkillCategory } | { type: "skill"; item: Skill };

function sortCategories(items: SkillCategory[]) { return [...items].sort((left, right) => left.display_order - right.display_order || left.id - right.id); }
function sortSkills(items: Skill[]) { return [...items].sort((left, right) => left.display_order - right.display_order || left.id - right.id); }

export function SkillsManager({ initialCategories, initialSkills }: Props) {
  const [categories, setCategories] = useState<SkillCategory[] | null>(initialCategories);
  const [skills, setSkills] = useState<Skill[] | null>(initialSkills);
  const [loadError, setLoadError] = useState(initialCategories === null || initialSkills === null);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null | undefined>(undefined);
  const [editingSkill, setEditingSkill] = useState<Skill | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function reload() {
    setLoadError(false);
    try {
      const [nextCategories, nextSkills] = await Promise.all([listSkillCategories(), listSkills()]);
      setCategories(sortCategories(nextCategories)); setSkills(sortSkills(nextSkills));
    } catch { setLoadError(true); }
  }

  async function saveCategory(input: SkillCategoryInput) {
    const target = editingCategory;
    const saved = target ? await updateSkillCategory(target.id, input) : await createSkillCategory(input);
    setCategories((current) => sortCategories([...(current ?? []).filter((item) => item.id !== saved.id), saved]));
    setEditingCategory(undefined); setFeedback(target ? "Skill category updated." : "Skill category created.");
  }

  async function saveSkill(input: SkillInput) {
    const target = editingSkill;
    const saved = target ? await updateSkill(target.id, input) : await createSkill(input);
    setSkills((current) => sortSkills([...(current ?? []).filter((item) => item.id !== saved.id), saved]));
    setEditingSkill(undefined); setFeedback(target ? "Skill updated." : "Skill created.");
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true); setDeleteError(null);
    try {
      if (deleting.type === "category") {
        await deleteSkillCategory(deleting.item.id);
        setCategories((current) => (current ?? []).filter((category) => category.id !== deleting.item.id));
        setFeedback("Skill category deleted.");
      } else {
        await deleteSkill(deleting.item.id);
        setSkills((current) => (current ?? []).filter((skill) => skill.id !== deleting.item.id));
        setFeedback("Skill deleted.");
      }
      setDeleting(null);
    } catch (cause) {
      const code = cause instanceof SkillApiError ? cause.code : "unavailable";
      setDeleteError(deleting.type === "category" && code === "conflict"
        ? "Remove the skills from this category before deleting it."
        : code === "not_found" ? "This record is no longer available. Reload the list and try again." : "Unable to delete this record right now. Please try again.");
    } finally { setDeletingBusy(false); }
  }

  if (categories === null || skills === null) {
    if (!loadError) return <LoadingState title="Loading skills" description="Fetching skill categories and skills from the portfolio API." />;
    return <ErrorState title="Skills are currently unavailable." description="Check the API connection and try loading categories and skills again." action={<Button onClick={() => void reload()}>Retry</Button>} />;
  }

  return <div className="space-y-5">
    {feedback ? <p role="status" className="border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {loadError ? <p role="status" className="flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">The lists could not be refreshed. Showing the last available data.<Button size="small" onClick={() => void reload()}>Retry</Button></p> : null}
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-ink-muted">Manage skill groups, names, optional icon references, and ordering.</p><div className="flex flex-wrap gap-2"><Button onClick={() => { setFeedback(null); setEditingCategory(null); }}><Plus size={15} />Add Category</Button><Button variant="primary" onClick={() => { setFeedback(null); setEditingSkill(null); }} disabled={categories.length === 0} title={categories.length === 0 ? "Create a category first" : undefined}><Plus size={15} />Add Skill</Button></div></div>
    {categories.length === 0 ? <EmptyState title="No skill categories have been added yet." description="Create a category before adding skills." action={<Button variant="primary" onClick={() => setEditingCategory(null)}><Plus size={15} />Add Category</Button>} /> :
      <div className="space-y-4">{sortCategories(categories).map((category) => {
        const categorySkills = sortSkills(skills.filter((skill) => skill.category_id === category.id));
        return <section key={category.id} aria-labelledby={`skill-category-${category.id}`} className="border border-border bg-surface">
          <header className="flex flex-col gap-3 border-b border-border bg-canvas/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 id={`skill-category-${category.id}`} className="break-words font-serif text-xl text-ink">{category.name}</h3><Badge>Order {category.display_order}</Badge></div><p className="mt-1 text-xs text-ink-muted">{categorySkills.length} {categorySkills.length === 1 ? "skill" : "skills"}</p></div><div className="flex gap-1"><Button size="small" variant="ghost" onClick={() => { setFeedback(null); setEditingCategory(category); }} aria-label={`Edit ${category.name} category`}><Pencil size={14} />Edit</Button><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => { setDeleteError(null); setDeleting({ type: "category", item: category }); }} aria-label={`Delete ${category.name} category`}><Trash2 size={14} />Delete</Button></div></header>
          {categorySkills.length > 0 ? <ul className="divide-y divide-border">{categorySkills.map((skill) => <li key={skill.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-center gap-3"><span className="size-1.5 shrink-0 bg-accent" aria-hidden="true" /><div className="min-w-0"><p className="break-words font-medium text-ink">{skill.name}</p><p className="text-xs text-ink-muted">Order {skill.display_order}{skill.icon ? " · Icon reference set" : ""}</p></div></div><div className="flex gap-1"><Button size="small" variant="ghost" onClick={() => { setFeedback(null); setEditingSkill(skill); }} aria-label={`Edit ${skill.name}`}><Pencil size={14} />Edit</Button><Button size="small" variant="ghost" className="text-error hover:text-error" onClick={() => { setDeleteError(null); setDeleting({ type: "skill", item: skill }); }} aria-label={`Delete ${skill.name}`}><Trash2 size={14} />Delete</Button></div></li>)}</ul> : <p className="px-4 py-5 text-sm text-ink-muted sm:px-5">No skills in this category yet.</p>}
        </section>;
      })}</div>}
    {editingCategory !== undefined ? <CategoryForm category={editingCategory} onSave={saveCategory} onClose={() => setEditingCategory(undefined)} /> : null}
    {editingSkill !== undefined && categories.length > 0 ? <SkillForm skill={editingSkill} categories={categories} onSave={saveSkill} onClose={() => setEditingSkill(undefined)} /> : null}
    {deleting ? <ConfirmDialog title={deleting.type === "category" ? "Delete this skill category?" : "Delete this skill?"} message={deleting.type === "category" ? `${deleting.item.name} will be permanently removed if it contains no skills.` : `${deleting.item.name} will be permanently removed.`} error={deleteError} busy={deletingBusy} confirmLabel={deleting.type === "category" ? "Delete category" : "Delete skill"} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} /> : null}
  </div>;
}
