import { createCrudRecord, deleteCrudRecord, listCrudRecords, updateCrudRecord } from "@/lib/api/crud-client";
export { CrudApiError as CertificateApiError } from "@/lib/api/crud-client";

export type Certificate = {
  id: number;
  title: string;
  issuer: string | null;
  issue_date: string | null;
  credential_url: string | null;
  certificate_image: string | null;
  certificate_file: string | null;
  description: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CertificateInput = Omit<Certificate, "id" | "created_at" | "updated_at">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

export function isCertificateResponse(value: unknown): value is Certificate {
  return isRecord(value) && typeof value.id === "number" && typeof value.title === "string" && nullableString(value.issuer) &&
    nullableString(value.issue_date) && nullableString(value.credential_url) && nullableString(value.certificate_image) &&
    nullableString(value.certificate_file) && nullableString(value.description) && typeof value.featured === "boolean" &&
    typeof value.display_order === "number" && typeof value.created_at === "string" && typeof value.updated_at === "string";
}

export function listCertificates() { return listCrudRecords("/api/admin/certificates", isCertificateResponse); }
export function createCertificate(input: CertificateInput) { return createCrudRecord("/api/admin/certificates", input, isCertificateResponse); }
export function updateCertificate(id: number, input: CertificateInput) { return updateCrudRecord("/api/admin/certificates", id, input, isCertificateResponse); }
export function deleteCertificate(id: number) { return deleteCrudRecord("/api/admin/certificates", id); }
