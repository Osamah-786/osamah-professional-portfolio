import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin } from "@/lib/api/projects-server";
import { crudRouteResponse, isCrudBody } from "@/lib/api/crud-server";

type RouteContext = { params: Promise<{ id: string }> };

async function validId(context: RouteContext) {
  const value = Number((await context.params).id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  const id = await validId(context);
  if (id === null) return NextResponse.json({ code: "not_found" }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ code: "validation" }, { status: 400 }); }
  if (!isCrudBody(body)) return NextResponse.json({ code: "validation" }, { status: 400 });
  return crudRouteResponse(await callProjectsBackend(`/api/admin/certificates/${id}`, "PUT", body));
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  const id = await validId(context);
  if (id === null) return NextResponse.json({ code: "not_found" }, { status: 404 });
  return crudRouteResponse(await callProjectsBackend(`/api/admin/certificates/${id}`, "DELETE"));
}
