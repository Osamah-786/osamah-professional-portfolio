# Repository instructions for coding agents

## Project map and boundaries

This repository has three independent applications:

- `portfolio-backend/`: FastAPI, SQLAlchemy, Pydantic and MySQL.
- `frontend/`: public Next.js App Router portfolio.
- `Osamah-portfolio-admin-dashboard/`: separate private Next.js admin CMS.
- `osamah-portfolio/`: Stitch design reference assets, not an application.

**Before changing code, inspect the relevant existing implementation and API contract. Do not recreate existing functionality.** Read the target app's `AGENTS.md` as well as this file.

Do not modify the public frontend when a task is limited to admin, or the admin when a task is limited to the public site. Backend contract changes affect both Next.js apps: inspect their API clients and coordinate/update only the consumers necessary for an intentional contract change. Preserve the current routes unless there is a strong, documented reason to change them.

## Route map

Public: `/`, `/projects`, `/projects/[slug]`, `/certificates`.

Admin: `/admin/login`, `/admin`, `/admin/projects`, `/admin/experience`, `/admin/certificates`, `/admin/content`. The `/` route in admin redirects to `/admin`.

Backend mounts routes in `portfolio-backend/app/main.py`; consult its README/API inventory and route/schema source for exact methods, paths, auth and fields. Never invent an endpoint or response field.

## Architecture

Public pages are Next.js Server Components using typed functions in `frontend/lib/api/`, shared response types in `frontend/types/api.ts`, and `NEXT_PUBLIC_API_URL`. FastAPI serves public GET requests and admin mutations. The backend uses SQLAlchemy sessions and MySQL. Cloudinary stores media binaries; the `media` database table stores URL/public ID/type/alt-text metadata.

The admin authenticates through `app/api/auth/login/route.ts`: the Next server calls FastAPI login, then places the returned JWT plus an HMAC-SHA256 signature in an HttpOnly cookie. `proxy.ts` and the protected route-group layout validate this session cookie. Admin server helpers verify it and forward the bearer token to FastAPI. FastAPI independently validates JWT signature/expiry and looks up the admin user. Logout expires the cookie; there is no backend token-revocation or refresh route in the inspected source.

The cookie is browser-managed and **signed, not encrypted**. HttpOnly prevents frontend JavaScript from reading it, but does not make a JWT safe to serialize into props, API response bodies, DOM, logs, URLs, local/session storage or client state. Keep token extraction/forwarding in server-only execution paths. Never expose `JWT_SECRET_KEY`, `ADMIN_SESSION_SECRET`, Cloudinary API credentials, or database credentials.

## Environment variables

- Backend: `APP_NAME`, `APP_VERSION`, `DEBUG`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MEDIA_MAX_UPLOAD_SIZE_MB`, `FRONTEND_URL`.
- Public frontend: `NEXT_PUBLIC_API_URL`.
- Admin: `NEXT_PUBLIC_API_URL`, `ADMIN_SESSION_SECRET` (server-only HMAC secret, at least 32 bytes).

Do not open private `.env` or `.env.local` values for documentation or routine inspection. Read `.env.example` instead. `NEXT_PUBLIC_` values are client-visible; only put public base URLs there.

## Coding and integration rules

- Check backend Pydantic schemas and route behavior before frontend work. Keep date formats, nullable values, ordering, featured semantics and validation aligned with actual contracts.
- Do not add a second API client when one already exists. Public API calls belong in `frontend/lib/api/`; admin API calls belong in admin `lib/api/` and server route handlers where credentials are involved.
- Do not call protected backend routes directly from browser components or pass a JWT to them. Use the established Next.js server proxy/session architecture.
- Keep binary uploads out of MySQL. Use backend media endpoints and Cloudinary workflow; do not put Cloudinary secrets in either frontend.
- Do not add hardcoded/mock portfolio records to make CMS or public sections look populated. Empty/error states must reflect API outcomes.
- Reuse existing components, Tailwind tokens, routes and typography. Keep client components limited to browser interaction; prefer Server Components for data fetching.
- Avoid `any`, unnecessary dependencies, duplicate state/data, and unrelated refactors.
- Only update docs/status after checking source. Do not claim live MySQL, Cloudinary, or API behavior was verified unless it was tested against those services.

## Current implementation status

| Area | Status | Evidence/limit |
|---|---|---|
| Backend foundation, models and schemas | COMPLETE | FastAPI/SQLAlchemy/Pydantic source exists; schema is provisioned externally. |
| Backend authentication | COMPLETE | Argon2/JWT code exists; live DB-backed login was not verified. |
| Projects, Experience, Certificates APIs | COMPLETE | Public reads and protected CRUD routes exist. |
| Skills, Achievements, Social Links APIs | COMPLETE | Public reads and protected CRUD routes exist. |
| Profile API | COMPLETE | Public read and protected current-profile update exist. |
| Media API | COMPLETE | Public item read and protected media CRUD/upload routes exist. |
| Backend CORS | COMPLETE | Explicit origin config and tests exist. |
| Backend automated tests | COMPLETE | 17 passed using fake DB/provider paths. |
| Live MySQL/backend authentication | BLOCKED | Port 3306 reachable, configured authentication rejected with MySQL 1045; live persistence/auth not verified. |
| Cloudinary provider | COMPLETE | Direct read-only ping and temporary upload/delete succeeded; backend media record flow is unverified. |
| Public frontend | COMPLETE | Home, Projects archive/detail, Certificates and typed API layer exist. |
| Admin auth and dashboard | COMPLETE | Login, HttpOnly session, route protection, logout and overview exist. |
| Admin Projects CRUD | COMPLETE | CRUD UI and same-origin Next handlers exist; live CRUD not verified. |
| Admin Experience CRUD | COMPLETE | UI and protected same-origin handlers exist; live CRUD unverified. |
| Admin Certificates CRUD | COMPLETE | UI and protected same-origin handlers exist; live CRUD unverified. |
| Admin Profile/Skills/Achievements/Social Links | COMPLETE | Content editors and protected handlers exist; live CRUD unverified. |
| Admin Media management | COMPLETE | Inventory/upload/update/delete UI and handlers exist; live Cloudinary unverified. Client upload cap is 10 MB. |
| DevOps/deployment | NOT STARTED | No infrastructure implementation was found in the three app trees. |

Status is implementation status, not production readiness. Re-audit it before changing this table.

## Validation and known limitations

- Backend: from `portfolio-backend`, run `python -B -c "from app.main import app"` and `python -B -m unittest discover -v`.
- Frontend: from `frontend`, run `npm run lint` and `npm run build`; package scripts do not define a `typecheck` command, but `npx tsc --noEmit` is available through installed TypeScript.
- Admin: from its directory, run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Verify live API/database/provider operations separately; mocked tests do not prove service availability.
- Windows/OneDrive `.next` EPERM has appeared intermittently. Report exact paths/errors and avoid architectural workarounds.
- Final verification: backend import and all 17 tests passed; both apps' TypeScript, ESLint and production builds passed in the temporary copy outside OneDrive. `.next` `EPERM` is confirmed specific to the OneDrive location. FastAPI `/docs` returned 200. MySQL port is reachable but auth fails with 1045; Cloudinary provider upload/delete passed directly, while API/database integration is unverified.
- Backend source does not create MySQL tables at startup and no migration tooling is present in the inspected app.

## Recommended sequence

1. Re-read app documentation and inspect current code before picking up a feature.
2. Verify local environment and service health without exposing secrets.
3. Implement one feature within its app boundary, matching the existing API contract.
4. Validate type/lint/build or unit tests; distinguish static checks from live integration checks.
5. Update app README/status only when the implementation actually changes.
