import { callProjectsBackend } from "@/lib/api/projects-server";
import { crudRouteResponse } from "@/lib/api/crud-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return crudRouteResponse(await callProjectsBackend("/api/admin/media", "GET"), { missing: "unavailable" });
}
