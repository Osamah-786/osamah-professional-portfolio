import { NextResponse } from "next/server";
import { callProjectsBackend, isSameOrigin } from "@/lib/api/projects-server";
import { crudRouteResponse, isCrudBody } from "@/lib/api/crud-server";
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: "unavailable" }, { status: 403 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ code: "validation" }, { status: 400 }); }
  if (!isCrudBody(body)) return NextResponse.json({ code: "validation" }, { status: 400 });
  return crudRouteResponse(await callProjectsBackend("/api/admin/sections/reorder", "PUT", body));
}
