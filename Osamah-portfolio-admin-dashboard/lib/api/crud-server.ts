import { NextResponse } from "next/server";
import type { BackendResult } from "@/lib/api/projects-server";

export function crudRouteResponse(result: BackendResult, options?: { missing?: "unavailable" }) {
  if (result.status >= 200 && result.status < 300) {
    return result.status === 204 ? new NextResponse(null, { status: 204 }) : NextResponse.json(result.body, { status: result.status });
  }
  const code = result.status === 401 || result.status === 403
    ? "unauthorized"
    : result.status === 404 && options?.missing !== "unavailable"
      ? "not_found"
      : result.status === 409
        ? "conflict"
        : result.status === 400 || result.status === 413 || result.status === 422
          ? "validation"
          : "unavailable";
  const status = result.status === 404 && options?.missing === "unavailable" ? 503 :
    [400, 401, 403, 404, 409, 413, 422].includes(result.status) ? result.status : 503;
  return NextResponse.json({ code }, { status });
}

export function isCrudBody(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
