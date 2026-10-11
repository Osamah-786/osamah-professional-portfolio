import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/admin/account-settings-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Account Settings" };

export default function AccountSettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="ADMIN / SECURITY"
        title="Account Settings"
        description="Update the credentials used to access your portfolio dashboard."
      />
      <AccountSettingsForm />
    </>
  );
}
