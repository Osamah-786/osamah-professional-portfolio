import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin, publicErrorStatus } from "@/lib/api/projects-server";

export const dynamic = "force-dynamic";

function respond(status: number, body?: unknown) {
  if (status >= 200 && status < 300) return NextResponse.json(body, { status });
  const code = status === 401 ? "unauthorized" : status === 409 ? "slug_conflict" : status === 422 || status === 400 ? "validation" : "unavailable";
  return NextResponse.json({ code }, { status: publicErrorStatus(status) });
}

export async function GET() {
  const result = await callProjectsBackend("/api/projects", "GET");
  return respond(result.status, result.body);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }
  const result = await callProjectsBackend("/api/admin/projects", "POST", body);
  return respond(result.status, result.body);
}
