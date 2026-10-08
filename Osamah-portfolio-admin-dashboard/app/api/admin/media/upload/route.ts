import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin } from "@/lib/api/projects-server";
import { crudRouteResponse } from "@/lib/api/crud-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });

  let incoming: FormData;
  try { incoming = await request.formData(); }
  catch { return NextResponse.json({ code: "validation" }, { status: 400 }); }

  const file = incoming.get("file");
  if (!(file instanceof File)) return NextResponse.json({ code: "validation" }, { status: 400 });
  const rawAltText = incoming.get("alt_text");
  if (rawAltText !== null && typeof rawAltText !== "string") return NextResponse.json({ code: "validation" }, { status: 400 });
  const altText = typeof rawAltText === "string" ? rawAltText.trim() : "";
  if (altText.length > 500) return NextResponse.json({ code: "validation" }, { status: 400 });

  const forwarded = new FormData();
  forwarded.append("file", file, file.name);
  if (altText) forwarded.append("alt_text", altText);
  return crudRouteResponse(await callProjectsBackend("/api/admin/media/upload", "POST", forwarded));
}
