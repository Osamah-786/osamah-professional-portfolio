"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { AuthClientError, loginAdmin } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/form-controls";

export function LoginForm() {
  const router = useRouter();
  const submissionStarted = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current) return;

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!username || !password) {
      setErrorMessage("Enter your username and password.");
      return;
    }

    submissionStarted.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await loginAdmin({ username, password });
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof AuthClientError && error.code === "invalid_credentials"
          ? "Invalid username or password."
          : "Unable to connect to the server. Please try again.",
      );
    } finally {
      submissionStarted.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-5">
      <div>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={isSubmitting}
          placeholder="Enter your username"
          className="min-h-12"
        />
      </div>

      <div>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            placeholder="Enter your password"
            className="min-h-12 pr-14"
          />
          <button
            type="button"
            disabled={isSubmitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed"
          >
            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p
          id="login-error"
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 border border-error/30 bg-error/10 px-3 py-2.5 text-sm leading-5 text-error"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full justify-between px-4">
        <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
        {isSubmitting ? (
          <span className="size-4 animate-spin border-2 border-canvas/40 border-t-canvas" aria-hidden="true" />
        ) : (
          <ArrowRight size={16} aria-hidden="true" />
        )}
      </Button>
    </form>
  );
}
