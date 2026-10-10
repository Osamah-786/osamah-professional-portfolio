# Admin dashboard agent instructions

## App boundary and current routes

This directory is the separate private Next.js admin CMS. Do not modify `frontend/` during an admin-only task. Do not change `portfolio-backend/` unless a genuine API contract mismatch blocks the requested feature; inspect schemas/routes and both consumers first. Preserve existing route URLs.

Routes: `/` redirects to `/admin`; `/admin/login`; protected `/admin`, `/admin/projects`, `/admin/experience`, `/admin/certificates`, `/admin/content`. Implemented management includes Projects, Experience, Certificates, Profile, Skills/categories, Achievements, Social Links, and Media. The dashboard overview reads counts/recent items. Backend and storage availability are separate from the existence of these UI/handler workflows; do not claim live operation without verification.

Before changing code, inspect the relevant existing implementation and API contract. Do not recreate existing functionality. Read the installed Next.js guidance in `node_modules/next/dist/docs/` for version-sensitive behavior.

## Authentication and token handling

- Login flow: client login form → same-origin `POST /api/auth/login` → Next route handler calls FastAPI `POST /api/auth/login` → receives bearer JWT → writes `${JWT}~${HMAC-SHA256(JWT, ADMIN_SESSION_SECRET)}` to a signed cookie.
- Cookie: HttpOnly, SameSite Strict, Path `/`, Secure in production, expiry follows JWT `exp`; development name `portfolio_admin_session`, production name `__Host-portfolio_admin_session`.
- The cookie is signed, **not encrypted**. The browser manages/sends the HttpOnly cookie, but JavaScript cannot read it. Do not expose JWT via props, component state, page HTML/DOM, client API payloads, local/session storage, URL or logs.
- `ADMIN_SESSION_SECRET` is a separate server-only HMAC key (minimum 32 UTF-8 bytes, placeholders are rejected). It is not `JWT_SECRET_KEY`; never expose or reuse either secret.
- `proxy.ts` validates cookie HMAC and basic `sub`/`exp` claims for `/admin` routes. The protected route-group layout repeats this guard. FastAPI still validates the JWT and admin database user on protected operations. Do not mistake Next cookie validation for API authorization.
- Logout `POST /api/auth/logout` checks same-origin and expires the cookie. It does not revoke the backend JWT.
- The backend token helper belongs in server execution paths only. `lib/api/projects-server.ts` verifies the cookie, then adds the Bearer header to a server-to-server request. Do not move it into a client module.

## API patterns

- Public backend base URL is `NEXT_PUBLIC_API_URL`, without embedded credentials. Do not hardcode localhost.
- `lib/api/dashboard.ts` loads overview data server-side. Use actual backend paths and types; note media listing is protected at `/api/admin/media`.
- Projects browser functions in `lib/api/projects.ts` call same-origin `/api/admin/projects` handlers. The server handlers use `lib/api/projects-server.ts` to authenticate/forward requests, sanitize backend errors and enforce same-origin write requests.
- Add protected CRUD using the same-origin Next handler/server-helper boundary. Never put JWTs in browser Authorization headers and never expose raw FastAPI error details.
- Match actual Pydantic request/response schemas, nullable/partial update semantics, validation, 404/409 behavior, featured/order flags and backend sorting. Do not invent endpoint paths or fields.
- Avoid duplicate API clients or fetch logic. Keep `fetch` in API/helper/route boundary, not scattered across page components.

## UI and implementation rules

- Reuse components in `components/ui/`, shell patterns in `components/admin/`, and the current graphite/off-black, off-white, copper, thin-border editorial design system.
- Prefer Server Components for data retrieval. Use Client Components for forms/dialogs/interactions only; never place backend token extraction there.
- Keep admin pages responsive and keyboard accessible; use labels, visible focus, semantic headings, accessible native dialogs, confirmation before destructive operations, and understandable status/error feedback.
- Include loading, empty, unavailable and mutation states. Never use fabricated portfolio records as a substitute for an API response.
- Images may be public local or HTTPS URLs; keep secrets out. Media binaries go only to the existing multipart media upload route. Admin upload controls cap files at 4 MB to stay below Vercel Functions' 4.5 MB total request-body limit. The backend's `MEDIA_MAX_UPLOAD_SIZE_MB` defaults to 10 MB and may be configured up to 100 MB; backend validation remains authoritative.
- Avoid `any`, unnecessary dependencies, duplicate state/data, oversized components and unrelated public-site/backend changes.

## Environment and security

Current variables: `NEXT_PUBLIC_API_URL` (public API base URL) and `ADMIN_SESSION_SECRET` (private HMAC key, at least 32 bytes). Backend secrets belong only in backend environment configuration. Do not inspect `.env.local` values for documentation; `.env.example` is the safe reference.

Do not add Cloudinary credentials, database passwords, backend JWT signing key or cookie-signing key to client code or `NEXT_PUBLIC_*`. Do not log credentials, request bodies containing passwords, session cookie values or JWTs. Write route handlers must check request origin as existing login/logout/project handlers do.

## Validation and status

Run from this directory:

```powershell
npm run typecheck
npm run lint
npm run build
```

`npm run typecheck` is `tsc --noEmit`. Static checks do not verify live backend/MySQL CRUD; report it separately. No new CRUD is complete until code and its validation evidence are reviewed.

Current implementation: authentication and shell exist; dashboard overview reads API counts; Projects, Experience, Certificates, Profile, Skills/categories, Achievements, Social Links and Media management workflows are implemented. Final verification from the temporary copy outside OneDrive: `npm run typecheck`, `npm run lint`, and `npm run build` pass. The prior `.next` `EPERM` is location-specific to OneDrive. Backend import and 17 unit tests pass; FastAPI starts and `/docs` returns 200. MySQL port 3306 is reachable but credentials are rejected (1045), blocking live auth/CRUD. Direct Cloudinary provider upload/delete passes; backend media+DB flow is unverified. No deployment/DevOps work is implemented.

Windows/OneDrive `.next` `EPERM` has been confirmed by successful production builds from a temporary copy at `C:\Dev\Osamah-Portfolio-Audit`. Treat it as a filesystem/location issue; do not redesign architecture to work around it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
