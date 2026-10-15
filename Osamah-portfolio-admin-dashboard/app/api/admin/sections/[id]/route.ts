import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin } from "@/lib/api/projects-server";
import { crudRouteResponse, isCrudBody } from "@/lib/api/crud-server";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function sectionPath(context: Context) { const { id } = await context.params; return /^\d+$/.test(id) ? `/api/admin/sections/${id}` : null; }
export async function GET(_request: Request, context: Context) { const path = await sectionPath(context); return path ? crudRouteResponse(await callProjectsBackend(path, "GET")) : NextResponse.json({ code: "not_found" }, { status: 404 }); }
export async function PUT(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  const path = await sectionPath(context); if (!path) return NextResponse.json({ code: "not_found" }, { status: 404 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ code: "validation" }, { status: 400 }); }
  if (!isCrudBody(body)) return NextResponse.json({ code: "validation" }, { status: 400 });
  return crudRouteResponse(await callProjectsBackend(path, "PUT", body));
}
export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  const path = await sectionPath(context); return path ? crudRouteResponse(await callProjectsBackend(path, "DELETE")) : NextResponse.json({ code: "not_found" }, { status: 404 });
}
