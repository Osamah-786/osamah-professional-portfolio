import type { ComponentPropsWithoutRef } from "react";

type DividerProps = Omit<ComponentPropsWithoutRef<"hr">, "color">;

export function Divider({ className, ...props }: DividerProps) {
  return (
    <hr
      className={`w-full border-0 border-t border-border ${className ?? ""}`}
      {...props}
    />
  );
}
