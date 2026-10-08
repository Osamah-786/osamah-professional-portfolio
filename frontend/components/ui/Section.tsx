import type { ComponentPropsWithoutRef } from "react";

type SectionProps = ComponentPropsWithoutRef<"section">;

export function Section({ className, ...props }: SectionProps) {
  return (
    <section
      className={`py-16 sm:py-20 lg:py-24 ${className ?? ""}`}
      {...props}
    />
  );
}
