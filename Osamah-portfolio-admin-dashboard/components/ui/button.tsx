import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "default" | "small";
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-canvas hover:bg-accent-pressed hover:border-accent-pressed",
  secondary: "border-border bg-surface text-ink hover:border-border-strong hover:bg-surface-raised",
  ghost: "border-transparent bg-transparent text-ink-secondary hover:bg-surface-raised hover:text-ink",
  destructive: "border-[#3c1e22] bg-[#1f1315] text-error hover:bg-[#2b171a]",
};

export function Button({
  variant = "secondary",
  size = "default",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClasses = size === "small" ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm";

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
