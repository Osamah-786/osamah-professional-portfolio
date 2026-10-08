"use client";

import {
  Award,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  AlertCircle,
  UserRoundCog,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAdmin } from "@/lib/api/auth";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/admin/experience", label: "Experience", icon: UserRoundCog },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/content", label: "Content", icon: FileText },
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition-colors focus-visible:outline-offset-[-2px] ${
              active
                ? "border-accent bg-surface-raised text-ink"
                : "border-transparent text-ink-muted hover:bg-surface-raised hover:text-ink"
            }`}
          >
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceBrand() {
  return (
    <div className="border-b border-border px-5 py-5">
      <div className="flex items-center gap-2.5">
        <span className="size-2 bg-accent" aria-hidden="true" />
        <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">
          Portfolio CMS
        </span>
      </div>
      <p className="mt-2 pl-[18px] text-xs text-ink-muted">Admin workspace</p>
    </div>
  );
}

function LogoutControl({
  onLogout,
  isLoggingOut,
  error,
}: {
  onLogout: () => void;
  isLoggingOut: boolean;
  error: string | null;
}) {
  return (
    <div className="border-t border-border p-4">
      <button
        type="button"
        disabled={isLoggingOut}
        onClick={onLogout}
        className="flex min-h-11 w-full items-center gap-3 border border-border px-3 text-left text-sm text-ink-secondary transition-colors hover:border-border-strong hover:bg-surface-raised hover:text-ink disabled:cursor-wait disabled:opacity-60"
      >
        {isLoggingOut ? <span className="size-3 animate-spin border border-current border-r-transparent" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
        <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>
      </button>
      {error ? (
        <p role="alert" className="mt-2 flex items-start gap-2 text-xs leading-5 text-error">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logoutAdmin();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLogoutError("Unable to sign out right now. Please try again.");
      setIsLoggingOut(false);
    }
  }

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <WorkspaceBrand />
        <div className="px-3 py-5">
          <p className="mb-3 px-3 font-mono text-[0.62rem] uppercase tracking-[0.09em] text-ink-muted">
            Workspace
          </p>
          <Navigation pathname={pathname} />
        </div>
        <div className="mt-auto">
          <LogoutControl onLogout={handleLogout} isLoggingOut={isLoggingOut} error={logoutError} />
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-border bg-canvas px-4 sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden size-2 bg-accent sm:inline-block" aria-hidden="true" />
            <p className="truncate font-mono text-[0.67rem] uppercase tracking-[0.08em] text-ink-muted">
              Admin workspace <span className="px-1 text-border-strong">/</span>
              {navigationItems.find((item) => isActivePath(pathname, item.href))?.label ?? "Overview"}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border text-ink-secondary hover:bg-surface focus-visible:outline-offset-2 lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-9 lg:py-12">
          {children}
        </main>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-canvas/80 lg:hidden"
          />
          <aside
            id="admin-mobile-navigation"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(19rem,88vw)] flex-col border-l border-border bg-surface shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between">
              <WorkspaceBrand />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="mr-3 inline-flex min-h-11 min-w-11 items-center justify-center text-ink-muted hover:bg-surface-raised hover:text-ink"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <div className="px-3 py-5">
              <p className="mb-3 px-3 font-mono text-[0.62rem] uppercase tracking-[0.09em] text-ink-muted">
                Workspace
              </p>
              <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="mt-auto">
              <LogoutControl onLogout={handleLogout} isLoggingOut={isLoggingOut} error={logoutError} />
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
