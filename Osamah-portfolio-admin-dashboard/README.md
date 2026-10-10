# Admin Dashboard

The Admin Dashboard is the private CMS for the Osamah Professional Portfolio. It is a separate Next.js application that communicates with FastAPI through same-origin server handlers; it does not connect directly to MySQL or Cloudinary.

## Routes and current features

| Route | Functionality |
|---|---|
| `/` | Redirects to `/admin`. |
| `/admin/login` | Username/password login; valid sessions redirect to the dashboard. |
| `/admin` | Protected overview with backend resource counts/recent information. |
| `/admin/projects` | Project list, create/edit, featured/order controls, and delete. |
| `/admin/experience` | Experience create/edit/delete. |
| `/admin/certificates` | Certificate create/edit/delete. |
| `/admin/content` | Profile, skill categories/skills, achievements, social links, and media management. |

These workflows exist in source; their presence does not establish live database or Cloudinary connectivity.

## Authentication and session security

1. The browser posts credentials to same-origin `POST /api/auth/login`.
2. The Next.js route handler sends `username` and `password` to FastAPI `POST /api/auth/login`.
3. FastAPI verifies the Argon2 password hash and returns a JWT. The Next handler keeps it out of JSON and stores it with an HMAC-SHA256 signature in the session cookie.
4. Cookie flags are HttpOnly, SameSite Strict, Path `/`, Secure in production, and expiry follows the token. Cookie names: `portfolio_admin_session` in development and `__Host-portfolio_admin_session` in production.
5. `proxy.ts` and the protected layout validate the session. Server-side helpers verify the signed cookie and forward `Authorization: Bearer <JWT>` to FastAPI; FastAPI validates the JWT and administrator record independently.
6. Same-origin logout expires the cookie. There is no backend revocation endpoint; a token remains valid until expiration if obtained elsewhere.

The cookie is signed, **not encrypted**. Keep JWTs out of props, HTML, client state, browser storage, URLs, API responses, and logs. `ADMIN_SESSION_SECRET` is a server-only HMAC key distinct from backend `JWT_SECRET_KEY`; use at least 32 bytes. Never prefix it with `NEXT_PUBLIC_`.

## Backend integration and media

Admin forms call same-origin Next.js handlers under `/api/admin/...`. Server handlers validate the session, forward the token, enforce same-origin checks for writes, and sanitize responses/errors. Multipart data is forwarded as `FormData` without manually setting a multipart boundary. Browser code does not call protected backend routes directly.

Managed resources are projects, experience, certificates, profile, skill categories/skills, achievements, social links, and media. FastAPI routes and schemas define the contract.

Profile uploads accept JPG/JPEG/PNG/WEBP images and PDF resumes, with a 4 MB client-side limit for the Vercel Function request path. Files pass through the authenticated same-origin handler to FastAPI `POST /api/admin/media/upload`; FastAPI validates type/signature/size and uploads to Cloudinary. Cloudinary credentials stay on the backend. The returned URL updates the profile draft; click **Save profile** to persist through `PUT /api/admin/profile`. MySQL stores URL and metadata, not bytes. New PDFs use Cloudinary resource type `image`; legacy raw PDF assets remain deletable based on their stored URL. Browser inline display depends on Cloudinary response headers and PDF delivery configuration.

## Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
ADMIN_SESSION_SECRET=<generate-a-unique-secret-of-at-least-32-bytes>
```

`NEXT_PUBLIC_API_URL` is public configuration. Store `ADMIN_SESSION_SECRET` only in server environment settings and treat it as confidential. Never put database credentials, JWT signing keys, Cloudinary API credentials, or the session secret in browser code, source control, logs, or `NEXT_PUBLIC_*` values.

## Install, run, and validate

From this directory in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL and ADMIN_SESSION_SECRET in .env.local.
npm run dev -- --port 3001
```

Open `http://localhost:3001/admin/login`. Configure backend `FRONTEND_URL` for explicit browser origins in use.

| Command | Purpose |
|---|---|
| `npm run dev` | `next dev --webpack` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `app`, `components`, `lib`, and `proxy.ts` |
| `npm run build` | `next build --webpack` |
| `npm start` | Start after build. |

There is no admin unit-test script. Static checks do not verify live login, CRUD, uploads, or Cloudinary headers.

## Vercel deployment

Use the separate Admin Vercel project with **Root Directory** `Osamah-portfolio-admin-dashboard`. Configure:

```text
NEXT_PUBLIC_API_URL=https://osamah-portfolio-api.onrender.com
ADMIN_SESSION_SECRET=<unique-server-only-value-at-least-32-bytes>
```

Set the secret in Vercel's server environment settings; never prefix it with `NEXT_PUBLIC_`. Add both deployed app browser origins to backend `FRONTEND_URL`. No Vercel project configuration is checked in; these are dashboard settings.

## Troubleshooting

- **Login/API connection:** check API URL, backend availability, CORS browser origin, and that an admin account exists. Distinguish authentication/validation/server responses from network errors using sanitized server/backend diagnostics.
- **Upload failure:** check the same-origin handler, admin session, backend Cloudinary settings, accepted type/size, and provider availability. Do not place Cloudinary credentials in Vercel.
- **Resume downloads:** confirm the saved profile URL references the current upload and inspect Cloudinary `Content-Type` and `Content-Disposition`; this app does not set delivery headers.
- **Windows/OneDrive `.next` `EPERM`:** check the reported path and use the repository's temporary-copy guidance instead of changing app architecture.
