import type { ComponentPropsWithoutRef } from "react";

type BadgeTone = "neutral" | "accent" | "success" | "error";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface text-ink-secondary",
  accent: "border-accent/50 bg-surface text-accent",
  success: "border-success/50 bg-surface text-success",
  error: "border-error/50 bg-surface text-error",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[0.7rem] leading-5 tracking-[0.04em] ${toneClasses[tone]} ${className ?? ""}`}
      {...props}
    />
  );
}
