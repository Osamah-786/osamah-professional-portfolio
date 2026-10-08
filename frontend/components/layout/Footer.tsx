import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Container } from "@/components/ui/Container";

type FooterProps = Omit<ComponentPropsWithoutRef<"footer">, "children"> & {
  children: ReactNode;
};

export function Footer({ children, className, ...props }: FooterProps) {
  return (
    <footer
      className={`border-t border-border py-6 text-sm text-ink-muted ${className ?? ""}`}
      {...props}
    >
      <Container>{children}</Container>
    </footer>
  );
}
