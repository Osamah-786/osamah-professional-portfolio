"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AccountSettingsError, changeAdminPassword, changeAdminUsername } from "@/lib/api/account-settings";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/form-controls";

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="pr-14"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((show) => !show)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-ink-muted hover:text-ink disabled:cursor-not-allowed"
        >
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function errorText(error: unknown, context: "username" | "password") {
  if (!(error instanceof AccountSettingsError)) return "Unable to connect to the server. Please try again.";
  if (error.code === "invalid_current_password") return "The current password is incorrect.";
  if (error.code === "username_taken") return "That username is already in use.";
  if (error.code === "validation") return context === "username"
    ? "Enter a username from 1 to 100 characters and make both entries match."
    : "The password does not meet the requirements or the confirmation does not match.";
  if (error.code === "unauthorized") return "Your session has expired. Sign in again to continue.";
  return "Unable to save your account settings. Please try again.";
}

export function AccountSettingsForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  async function submitUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUsername = username.trim();
    setUsernameError(null);
    setUsernameSuccess(null);
    if (!usernameCurrentPassword || !nextUsername || nextUsername.length > 100) {
      setUsernameError("Enter your current password and a username from 1 to 100 characters.");
      return;
    }
    if (nextUsername !== confirmUsername.trim()) {
      setUsernameError("The username entries do not match.");
      return;
    }

    setUsernameBusy(true);
    try {
      await changeAdminUsername({
        current_password: usernameCurrentPassword,
        new_username: nextUsername,
        confirm_new_username: confirmUsername.trim(),
      });
      setUsernameCurrentPassword("");
      setUsernameSuccess("Username updated. Use the new username the next time you sign in.");
    } catch (error) {
      setUsernameError(errorText(error, "username"));
    } finally {
      setUsernameBusy(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!passwordCurrent || !newPassword) {
      setPasswordError("Enter your current password and a new password.");
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError("Your new password must be at least 12 characters long.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 1024) {
      setPasswordError("Your new password is too long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The password entries do not match.");
      return;
    }

    setPasswordBusy(true);
    try {
      await changeAdminPassword({
        current_password: passwordCurrent,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setPasswordCurrent("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated. Sign in with your new password.");
      window.setTimeout(() => router.replace("/admin/login"), 1200);
    } catch (error) {
      setPasswordError(errorText(error, "password"));
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="border border-border bg-surface p-4 sm:p-6" aria-labelledby="change-username-title">
        <div className="mb-5 border-b border-border pb-4">
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.09em] text-accent">Login identity</p>
          <h2 id="change-username-title" className="font-serif text-2xl font-normal text-ink">Change Username</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">Confirm your current password before changing the username used at sign in.</p>
        </div>
        <form onSubmit={submitUsername} aria-busy={usernameBusy} className="space-y-5">
          <PasswordField id="username-current-password" label="Current password" autoComplete="current-password" value={usernameCurrentPassword} onChange={setUsernameCurrentPassword} disabled={usernameBusy} />
          <div>
            <FieldLabel htmlFor="new-username">New username</FieldLabel>
            <Input id="new-username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={1} maxLength={100} required value={username} onChange={(event) => setUsername(event.target.value)} disabled={usernameBusy} />
          </div>
          <div>
            <FieldLabel htmlFor="confirm-username">Confirm new username</FieldLabel>
            <Input id="confirm-username" autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={1} maxLength={100} required value={confirmUsername} onChange={(event) => setConfirmUsername(event.target.value)} disabled={usernameBusy} />
          </div>
          {usernameError ? <p role="alert" aria-live="assertive" className="flex gap-2 border border-error/30 bg-error/10 px-3 py-2.5 text-sm leading-5 text-error"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{usernameError}</p> : null}
          {usernameSuccess ? <p role="status" className="flex gap-2 border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm leading-5 text-ink"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{usernameSuccess}</p> : null}
          <div className="flex justify-end border-t border-border pt-5">
            <Button type="submit" variant="primary" disabled={usernameBusy}>{usernameBusy ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </section>

      <section className="border border-border bg-surface p-4 sm:p-6" aria-labelledby="change-password-title">
        <div className="mb-5 border-b border-border pb-4">
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.09em] text-accent">Account security</p>
          <h2 id="change-password-title" className="font-serif text-2xl font-normal text-ink">Change Password</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">Use at least 12 characters. You will need to sign in again after the password changes.</p>
        </div>
        <form onSubmit={submitPassword} aria-busy={passwordBusy} className="space-y-5">
          <PasswordField id="password-current" label="Current password" autoComplete="current-password" value={passwordCurrent} onChange={setPasswordCurrent} disabled={passwordBusy} />
          <PasswordField id="password-new" label="New password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} disabled={passwordBusy} />
          <PasswordField id="password-confirm" label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} disabled={passwordBusy} />
          {passwordError ? <p role="alert" aria-live="assertive" className="flex gap-2 border border-error/30 bg-error/10 px-3 py-2.5 text-sm leading-5 text-error"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{passwordError}</p> : null}
          {passwordSuccess ? <p role="status" className="flex gap-2 border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm leading-5 text-ink"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{passwordSuccess}</p> : null}
          <div className="flex justify-end border-t border-border pt-5">
            <Button type="submit" variant="primary" disabled={passwordBusy}>{passwordBusy ? "Updating…" : "Update Password"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
