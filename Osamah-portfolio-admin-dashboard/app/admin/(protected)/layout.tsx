import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AUTH_COOKIE_NAME, isValidSessionCookie } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  if (!isValidSessionCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value)) redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
