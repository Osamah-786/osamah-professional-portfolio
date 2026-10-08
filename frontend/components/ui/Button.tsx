import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "text";

type ButtonBaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type LinkButtonProps = ButtonBaseProps & {
  href: string;
  disabled?: boolean;
  target?: ComponentPropsWithoutRef<"a">["target"];
  rel?: string;
};

type NativeButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps | "href"> & {
    href?: undefined;
  };

type ButtonProps = LinkButtonProps | NativeButtonProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-canvas hover:border-accent-hover hover:bg-accent-hover",
  secondary: "border-border bg-transparent text-ink hover:border-accent hover:bg-surface",
  text: "min-h-0 border-transparent bg-transparent px-0 text-ink-secondary underline decoration-border underline-offset-4 hover:text-ink hover:decoration-accent",
};

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50";

export function Button(props: ButtonProps) {
  const { children, variant = "primary", className, href, disabled, ...rest } = props;
  const classes = `${baseClasses} ${variantClasses[variant]} ${className ?? ""}`;

  if (href !== undefined) {
    return (
      <Link
        {...(rest as ComponentPropsWithoutRef<typeof Link>)}
        href={href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? (event) => event.preventDefault() : undefined}
        className={`${classes} ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      type={(rest as NativeButtonProps).type ?? "button"}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
