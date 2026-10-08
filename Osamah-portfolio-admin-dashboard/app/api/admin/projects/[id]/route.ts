import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin, publicErrorStatus } from "@/lib/api/projects-server";

type RouteContext = { params: Promise<{ id: string }> };

function respond(status: number, body?: unknown) {
  if (status >= 200 && status < 300) return status === 204 ? new NextResponse(null, { status }) : NextResponse.json(body, { status });
  const code = status === 401 ? "unauthorized" : status === 404 ? "not_found" : status === 409 ? "slug_conflict" : status === 422 || status === 400 ? "validation" : "unavailable";
  return NextResponse.json({ code }, { status: publicErrorStatus(status) });
}

async function validId(context: RouteContext): Promise<number | null> {
  const { id } = await context.params;
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  const id = await validId(context);
  if (id === null) return NextResponse.json({ code: "not_found" }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "validation" }, { status: 400 });
  }
  const result = await callProjectsBackend(`/api/admin/projects/${id}`, "PUT", body);
  return respond(result.status, result.body);
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  const id = await validId(context);
  if (id === null) return NextResponse.json({ code: "not_found" }, { status: 404 });
  const result = await callProjectsBackend(`/api/admin/projects/${id}`, "DELETE");
  return respond(result.status, result.body);
}
