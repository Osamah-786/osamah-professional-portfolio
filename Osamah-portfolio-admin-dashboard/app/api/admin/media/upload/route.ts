import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin } from "@/lib/api/projects-server";
import { crudRouteResponse } from "@/lib/api/crud-server";
import { isMediaResponse } from "@/lib/api/media";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    console.warn("[admin-backend] request diagnostic", { operation: "media_upload", stage: "origin_validation", status: 403 });
    return NextResponse.json({ code: "unavailable" }, { status: 403 });
  }

  let incoming: FormData;
  try { incoming = await request.formData(); }
  catch {
    console.warn("[admin-backend] request diagnostic", { operation: "media_upload", stage: "multipart_parse", status: 400 });
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!(file instanceof File)) {
    console.warn("[admin-backend] request diagnostic", { operation: "media_upload", stage: "file_validation", status: 400 });
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }
  const rawAltText = incoming.get("alt_text");
  if (rawAltText !== null && typeof rawAltText !== "string") {
    console.warn("[admin-backend] request diagnostic", { operation: "media_upload", stage: "alt_text_validation", status: 400 });
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }
  const altText = typeof rawAltText === "string" ? rawAltText.trim() : "";
  if (altText.length > 500) {
    console.warn("[admin-backend] request diagnostic", { operation: "media_upload", stage: "alt_text_validation", status: 400 });
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }

  const forwarded = new FormData();
  forwarded.append("file", file, file.name);
  if (altText) forwarded.append("alt_text", altText);
  const result = await callProjectsBackend("/api/admin/media/upload", "POST", forwarded, "media_upload");
  if (result.status >= 200 && result.status < 300 && !isMediaResponse(result.body)) {
    console.error("[admin-backend] request diagnostic", { operation: "media_upload", stage: "backend_response_contract", status: 502 });
    return NextResponse.json({ code: "unavailable" }, { status: 502 });
  }
  return crudRouteResponse(result);
}
