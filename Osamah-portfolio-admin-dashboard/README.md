# Admin Dashboard

The Admin Dashboard is the private CMS for the Osamah Professional Portfolio. It manages portfolio content through the FastAPI Backend and does not connect directly to MySQL or Cloudinary.

## Technology and structure

- Next.js App Router (`next` dependency range `^16.4.0`), React/React DOM 19.
- TypeScript, Tailwind CSS 4, and Lucide React.
- `NEXT_PUBLIC_API_URL` for the backend base URL; server-only `ADMIN_SESSION_SECRET` for signing the session cookie.
- `npm ci` installs dependencies from `package-lock.json`.

```text
app/
  admin/login/                 Login page
  admin/(protected)/           Overview and protected CMS pages
  api/auth/                    Login and logout route handlers
  api/admin/                   Same-origin handlers for protected resources
components/admin/              Shell and management forms
components/ui/                 Shared admin UI primitives
lib/api/                       Typed resource clients and server-side backend proxy
proxy.ts                       Cookie/session gate for /admin routes
```

The `(protected)` folder is a Next.js route group; parentheses do not become part of the URL. For example, `app/admin/(protected)/content/page.tsx` maps to `/admin/content`.

## Routes and current functionality

| URL | Behavior |
|---|---|
| `/` | Redirects to `/admin`. |
| `/admin/login` | Username/password login. An already-valid session redirects to `/admin`. |
| `/admin` | Server-rendered overview with counts/recent information from backend resources; sections can report unavailable data independently. |
| `/admin/projects` | Project list, create/edit, featured/order controls, and deletion. |
| `/admin/experience` | Experience create/edit/delete workflows. |
| `/admin/certificates` | Certificate create/edit/delete workflows. |
| `/admin/content` | Profile; skills/categories; achievements; social links; media inventory/upload/metadata/delete. |

The management forms and server handlers are implemented. Their presence does not establish live MySQL or Cloudinary availability.

## Authentication and session flow

1. The login form posts credentials to same-origin `POST /api/auth/login`.
2. The Next.js route handler sends `POST /api/auth/login` to FastAPI server-to-server.
3. FastAPI verifies the Argon2 password hash and returns a JWT. The Next.js handler keeps the token out of its JSON response and stores `${JWT}~${HMAC-SHA256(JWT, ADMIN_SESSION_SECRET)}` in a cookie.
4. The cookie is HttpOnly, SameSite Strict, Path `/`, Secure in production, and expires with the JWT. Its name is `portfolio_admin_session` in development and `__Host-portfolio_admin_session` in production.
5. `proxy.ts` validates the HMAC and basic token claims on `/admin` routes; the protected layout repeats the guard. Server-side helpers validate the signed cookie before forwarding `Authorization: Bearer <JWT>` to FastAPI. FastAPI independently validates the token and verifies the admin user still exists.
6. Same-origin `POST /api/auth/logout` expires the cookie. It does not revoke the backend JWT; the token remains valid until its expiration if obtained elsewhere.

The cookie is signed, **not encrypted**. HttpOnly prevents browser JavaScript from reading it, but the JWT must also stay out of props, rendered HTML, client state, browser storage, URLs, API response bodies, and logs. `ADMIN_SESSION_SECRET` is a distinct server-only HMAC key (minimum 32 UTF-8 bytes), not `JWT_SECRET_KEY`. Never send a bearer token from browser code.

## API integration

Browser management clients call same-origin Next.js handlers. The handlers and server-rendered admin pages use `lib/api/projects-server.ts` to validate the session, forward authenticated requests, enforce same-origin checks for writes, and sanitize backend errors. JWT extraction/forwarding remains server-side.

| Dashboard resource | Same-origin handler examples | FastAPI operations |
|---|---|---|
| Projects | `/api/admin/projects`, `/api/admin/projects/{id}` | Public `GET /api/projects`; protected create/update/delete under `/api/admin/projects`. |
| Experience | `/api/admin/experience`, `/api/admin/experience/{id}` | Public `GET /api/experience`; protected create/update/delete under `/api/admin/experience`. |
| Certificates | `/api/admin/certificates`, `/api/admin/certificates/{id}` | Public `GET /api/certificates`; protected create/update/delete under `/api/admin/certificates`. |
| Profile | `/api/admin/profile` | Public `GET /api/profile`; protected `PUT /api/admin/profile` updates the existing profile row. |
| Skills/categories | `/api/admin/skills`, `/api/admin/skill-categories` and ID handlers | Public reads; protected create/update/delete routes under `/api/admin/`. |
| Achievements/social links | Resource and ID handlers under `/api/admin/` | Public reads; protected create/update/delete routes under `/api/admin/`. |
| Media | `/api/admin/media`, `/api/admin/media/{id}`, `/api/admin/media/upload` | Protected inventory/mutations/upload under `/api/admin/media`; public individual metadata read at `/api/media/{id}`. |

Exact request fields, nullability, status codes, and validation are defined by the FastAPI schemas and routes in `portfolio-backend/app/`. Do not duplicate backend logic or expose raw backend response bodies.

## Profile image and resume upload

The Profile editor accepts JPG/JPEG/PNG/WEBP for the image and PDF for the resume, with a 10 MB client limit. It uploads through `POST /api/admin/media/upload`, the same-origin Next route forwards the multipart file to authenticated FastAPI, and FastAPI validates extension/MIME/signature/size before calling Cloudinary. Provider credentials never enter the browser.

After success, the returned Cloudinary `file_url` becomes the profile form's `profile_image` or `resume_url` draft value. The upload does not itself save the profile: click **Save profile** to persist the URL through the existing `PUT /api/admin/profile` contract. MySQL stores the URL and media metadata, not file bytes.

New PDFs use Cloudinary `resource_type="image"`; the metadata continues to store `file_type="application/pdf"`. Cloudinary PDF delivery must be enabled for the product environment. Media deletion infers `image` or legacy `raw` for PDF records from the stored Cloudinary URL, so old raw PDF assets remain deletable without a schema change. The Public Portfolio links directly to `profile.resume_url` in a new tab; no Next.js download proxy or custom PDF viewer is part of this app. Browser inline display depends on Cloudinary's actual response headers.

The backend defaults to a 10 MB limit and permits `MEDIA_MAX_UPLOAD_SIZE_MB` up to 100 MB; the current Admin Dashboard upload controls intentionally remain limited to 10 MB.

## Environment and security

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
ADMIN_SESSION_SECRET=<generate-a-unique-secret-of-at-least-32-bytes>
```

Generate a server secret locally, for example:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Treat the generated value as secret. `NEXT_PUBLIC_API_URL` is public configuration; `ADMIN_SESSION_SECRET` is server-only. Do not add MySQL credentials, `JWT_SECRET_KEY`, Cloudinary API keys/secrets, or session secrets to browser code, `NEXT_PUBLIC_*` values, source control, or logs.

## Install, run, and validate

Run from this directory in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL and ADMIN_SESSION_SECRET in .env.local.
npm run dev -- --port 3001
```

Open `http://localhost:3001/admin/login`. Port 3001 lets the Public Portfolio use its default port 3000 at the same time. Configure backend `FRONTEND_URL` to allow the explicit browser origins in use.

| Command | Package script |
|---|---|
| `npm run dev` | `next dev --webpack` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `app`, `components`, `lib`, and `proxy.ts` |
| `npm run build` | `next build --webpack` |
| `npm start` | `next start` |

There is no separate admin unit-test script. Static checks do not verify live authentication, database mutations, Cloudinary uploads, or PDF response headers.

## Troubleshooting and operational limits

- If login or data requests fail, check the backend URL, MySQL schema/configuration, admin account, and backend CORS origin. Backend schema provisioning is external.
- If uploads fail, check backend Cloudinary configuration and the configured size/type limits. Cloudinary credentials belong only in backend configuration.
- If a resume opens as a download, verify the saved profile URL points to the new Cloudinary `image/upload` PDF and inspect its `Content-Type` and `Content-Disposition`; the Admin Dashboard does not change those response headers.
- Windows/OneDrive may fail to create `.next` paths with `EPERM`. The issue has been observed in this workspace; validate from a temporary copy outside OneDrive before treating it as an application build failure. Do not change application architecture to work around the filesystem location.
- This project contains no deployment, Docker/Compose, CI/CD, or production infrastructure configuration.
