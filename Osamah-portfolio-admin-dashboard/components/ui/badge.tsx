import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "accent" | "success" | "error";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface text-ink-muted",
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-success/30 bg-success/10 text-success",
  error: "border-error/30 bg-error/10 text-error",
};

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex min-h-[22px] items-center border px-1.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.06em] ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
