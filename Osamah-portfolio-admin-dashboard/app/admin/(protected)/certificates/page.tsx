import type { Metadata } from "next";
import { CertificatesManager } from "@/components/admin/certificates/certificates-manager";
import { isCertificateResponse, type Certificate } from "@/lib/api/certificates";
import { callProjectsBackend } from "@/lib/api/projects-server";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesAdminPage() {
  let initialCertificates: Certificate[] | null = null;
  const result = await callProjectsBackend("/api/certificates", "GET");
  if (result.status >= 200 && result.status < 300 && Array.isArray(result.body) && result.body.every(isCertificateResponse)) initialCertificates = result.body;
  return <CertificatesManager initialCertificates={initialCertificates} />;
}
