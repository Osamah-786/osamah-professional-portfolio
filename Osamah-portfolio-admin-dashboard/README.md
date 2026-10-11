# Admin Dashboard

The Admin Dashboard is a separate Next.js application for maintaining the portfolio. Browser mutations use same-origin Next.js route handlers; server code forwards authenticated requests to FastAPI. The app does not connect directly to MySQL or Cloudinary.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Redirect | Redirects to `/admin`. |
| `/admin/login` | Public | Administrator login. |
| `/admin` | Protected | Dashboard overview. |
| `/admin/projects` | Protected | Project create, edit, ordering/featured controls, and delete. |
| `/admin/experience` | Protected | Experience management. |
| `/admin/certificates` | Protected | Certificate management. |
| `/admin/content` | Protected | Profile, skills/categories, achievements, social links, and media tools. |
| `/admin/settings` | Protected | Change the authenticated administrator's username or password. |

These screens and handlers are implemented in source. Their presence does not prove live API, database, or Cloudinary availability.

## Authentication and session

1. The browser submits login to same-origin `POST /api/auth/login`. The Next.js handler calls FastAPI login, which verifies the Argon2 password hash and returns a JWT.
2. The server handler stores the token in an HMAC-SHA256-signed HttpOnly cookie; it does not return the JWT in client JSON. The cookie is `portfolio_admin_session` in development and `__Host-portfolio_admin_session` in production. It uses SameSite Strict, Path `/`, Secure in production, and the token expiry.
3. `proxy.ts` and the protected route-group layout validate the session. Server-side API helpers verify the cookie and forward `Authorization: Bearer <JWT>` to FastAPI. FastAPI independently validates signature/expiry and reloads the administrator.
4. Same-origin logout expires the cookie. FastAPI has no logout, token revocation, or refresh endpoint.

The cookie is signed, **not encrypted**. HttpOnly prevents access by browser JavaScript; it does not make token data safe to serialize. Keep JWTs out of props, rendered HTML, client state, storage, URLs, API responses, and logs. `ADMIN_SESSION_SECRET` is a private server-side HMAC key, separate from backend `JWT_SECRET_KEY`.

### Account settings

The protected settings page offers separate username and password forms. Both require the current password and matching confirmation. The backend identifies the user from the authenticated JWT subject, enforces unique usernames, and hashes password updates with the existing Argon2 utility. New passwords require at least 12 characters. After a successful password change, the same-origin handler expires the dashboard cookie and the user must log in again. Backend JWTs are stateless and are not revoked; any separately copied token remains valid until expiry.

## Content and media workflow

Admin API handlers use same-origin paths and server-only session forwarding. They validate the session, enforce same-origin checks on writes, and sanitize errors/responses. Do not call protected backend routes directly from browser components.

Managed content includes projects, experience, certificates, profile, skill categories/skills, achievements, social links, and media. The exact backend methods and payload contracts are in [the backend API inventory](../portfolio-backend/README.md#api-inventory).

Reusable image inputs provide previews and replace/remove controls. For project, experience, certificate, achievement, and social-link image fields, browser upload validation accepts JPG/JPEG/PNG/WEBP up to 4 MiB per file. Social-link logos also support an image URL/reference mode. Clearing an image field clears the form value; saving the record persists that change and does not itself delete the old Cloudinary asset.

Profile photo uploads accept JPG/JPEG/PNG/WEBP, and resume uploads accept PDF. The uploaded URL is applied to the profile draft; choose **Save profile** to persist it. The media manager accepts JPG/JPEG/PNG/WEBP/PDF with optional alt text. Admin image controls use a 4 MiB request cap for the Vercel function path.

Upload flow: browser form -> same-origin authenticated Next.js handler -> FastAPI multipart endpoint -> backend validation -> Cloudinary. The database stores the URL/public ID/type/alt text/timestamps, not file bytes. Cloudinary API credentials remain in backend settings. Removing a media library item asks the backend to delete the provider asset and database metadata; if provider deletion fails, metadata deletion is not completed. New PDFs use Cloudinary image resources; inline PDF display depends on provider delivery configuration and response headers.

## Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit either file.

| Variable | Purpose | Required | Service and exposure | Example |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI base URL used by server handlers | Yes for API use | Admin Next app; public config (no secret) | `http://localhost:8000` |
| `ADMIN_SESSION_SECRET` | HMAC-SHA256 signature for the session cookie; use a unique value of at least 32 bytes | Yes | Admin server only; secret | `<generate-a-unique-32-byte-or-longer-secret>` |

Do not prefix the session secret with `NEXT_PUBLIC_`. Database, JWT, and Cloudinary values belong only in backend/Render configuration.

## Local setup and commands

From `Osamah-portfolio-admin-dashboard/` in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL and ADMIN_SESSION_SECRET in the local environment file.
npm run dev -- --port 3001
```

Open `http://localhost:3001/admin/login`. Configure backend `FRONTEND_URL` for the exact browser origins being used.

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js development server with Webpack. |
| `npm run typecheck` | TypeScript check. |
| `npm run lint` | ESLint over `app`, `components`, `lib`, and `proxy.ts`. |
| `npm run build` | Production build with Webpack. |
| `npm start` | Serve a completed production build. |

There is no admin unit-test script. Static checks do not verify login, CRUD, or uploads against live services.

## Vercel deployment

Use the separate admin Vercel project and set **Root Directory** to `Osamah-portfolio-admin-dashboard`. The project name/ID, linked repository, production branch, and current deployment state require confirmation in Vercel. A login URL recorded in project docs is [osamah-professional-portfolio-mjul.vercel.app/admin/login](https://osamah-professional-portfolio-mjul.vercel.app/admin/login); verify that it is current before relying on it.

Set `NEXT_PUBLIC_API_URL` to the intended FastAPI URL and set a unique `ADMIN_SESSION_SECRET` (at least 32 bytes) in Vercel's private server environment settings. Never expose it through `NEXT_PUBLIC_*`. Add both public and admin app origins as explicit backend `FRONTEND_URL` entries when required. No Vercel deployment configuration is checked in; confirm build and deployment status in the dashboard.

## Troubleshooting

- **Login/session rejected:** check backend URL, database-backed admin availability, token expiry, and the same private session secret across the deployment. Do not bypass JWT checks.
- **API proxy errors:** inspect sanitized server/backend diagnostics, backend reachability, route contract, and explicit CORS origins. Browser code should call same-origin handlers.
- **Upload errors:** check the 4 MiB admin request cap, accepted file type, session, backend upload limit, Cloudinary settings, and provider availability. Keep provider credentials in backend settings.
- **Resume/PDF display:** confirm the saved URL and Cloudinary delivery headers/configuration; the app does not set provider response headers.
- **Build filesystem error:** Windows/OneDrive may report `.next` EPERM. Use the exact error path when diagnosing; this is not evidence of a Vercel deployment failure.
