import { apiGet } from "@/lib/api/client";
import type { Certificate } from "@/types/api";

export function getCertificates(): Promise<Certificate[]> {
  return apiGet<Certificate[]>("/api/certificates", "array");
}

export function getFeaturedCertificates(): Promise<Certificate[]> {
  return apiGet<Certificate[]>("/api/certificates/featured", "array");
}

export function getCertificate(id: number): Promise<Certificate> {
  return apiGet<Certificate>(`/api/certificates/${encodeURIComponent(id)}`, "object");
}
