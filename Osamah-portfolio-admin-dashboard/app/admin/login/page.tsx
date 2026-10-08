import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_COOKIE_NAME, isValidSessionCookie } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  if (isValidSessionCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value)) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
      <section className="w-full max-w-md border border-border bg-surface p-5 sm:p-8">
        <div className="mb-8 border-b border-border pb-6">
          <div className="mb-7 flex items-center gap-2.5">
            <span className="size-2 bg-accent" aria-hidden="true" />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">
              Portfolio CMS
            </span>
          </div>
          <p className="mb-2 font-mono text-[0.66rem] uppercase tracking-[0.09em] text-ink-muted">
            Admin / Access
          </p>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Use your administrator credentials to continue to the portfolio workspace.
          </p>
        </div>

        <LoginForm />

        <p className="mt-7 flex items-center justify-center gap-2 border-t border-border pt-5 font-mono text-[0.62rem] uppercase tracking-[0.06em] text-ink-muted">
        <KeyRound size={13} aria-hidden="true" />
          Secure administrator access
        </p>
      </section>
    </main>
  );
}
