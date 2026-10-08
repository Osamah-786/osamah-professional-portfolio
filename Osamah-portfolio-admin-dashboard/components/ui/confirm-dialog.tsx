"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = { title: string; message: string; error?: string | null; busy?: boolean; confirmLabel: string; onCancel: () => void; onConfirm: () => void };

export function ConfirmDialog({ title, message, error, busy = false, confirmLabel, onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  return <dialog ref={dialog} aria-labelledby="confirm-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} className="m-auto w-[min(28rem,calc(100%-2rem))] border border-border bg-canvas p-0 text-ink shadow-2xl backdrop:bg-canvas/80">
    <div className="p-5 sm:p-6"><p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-error">PERMANENT ACTION</p><h2 id="confirm-dialog-title" className="mt-2 font-serif text-2xl">{title}</h2><p className="mt-3 text-sm leading-6 text-ink-muted">{message}</p>
      {error ? <p role="alert" className="mt-4 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-border pt-5 sm:flex-row"><Button onClick={onCancel} disabled={busy}>Cancel</Button><Button variant="destructive" onClick={onConfirm} disabled={busy}><span>{busy ? "Deleting…" : confirmLabel}</span></Button></div>
    </div>
  </dialog>;
}
