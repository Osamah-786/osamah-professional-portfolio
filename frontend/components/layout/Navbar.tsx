"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export type NavbarLink = {
  label: string;
  href: string;
};

type NavbarProps = {
  brand: ReactNode;
  links: readonly NavbarLink[];
  className?: string;
};

export function Navbar({ brand, links, className }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={`border-b border-border bg-canvas ${className ?? ""}`}>
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-8">
        <Link
          href="/"
          aria-label="Go to the portfolio home page"
          className="py-4 text-sm font-semibold tracking-[0.12em] no-underline hover:text-ink"
        >
          {brand}
        </Link>

        {links.length > 0 ? (
          <>
            <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
              {links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="py-5 text-sm text-ink-secondary no-underline transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-sm border border-border text-ink-secondary transition-colors hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent md:hidden"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            </button>

            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className={`${isMenuOpen ? "grid" : "hidden"} w-full gap-1 border-t border-border py-3 md:hidden`}
            >
              {links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-2 py-3 text-sm text-ink-secondary no-underline hover:bg-surface hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </>
        ) : null}
      </Container>
    </header>
  );
}
