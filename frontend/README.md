# Public Portfolio

The Public Portfolio is the visitor-facing Next.js application for the Osamah Professional Portfolio. It reads portfolio content from FastAPI and does not connect directly to the database or Cloudinary.

## Routes and features

| Route | Behavior |
|---|---|
| `/` | Fetches profile, featured projects, experience, skills/categories, featured certificates, achievements, and social links through typed API functions. Independent requests run concurrently; sections handle empty/unavailable data separately. |
| `/projects` | Displays backend projects. Detail links use `slug`; live and GitHub URLs remain external. |
| `/projects/[slug]` | Calls `getProjectBySlug(slug)`; missing records render not-found and API failures have an unavailable state. |
| `/certificates` | Displays certificates with formatted dates and empty/unavailable handling. |

The responsive design uses graphite/near-black, off-white, a restrained copper accent, thin borders, and editorial typography. Portfolio records are API-driven; section labels and presentation copy are frontend content. Local fallback images are not mock records.

## Stack and structure

- Next.js App Router (`^16.0.0`), React 19, TypeScript 5.
- Tailwind CSS 4, Framer Motion, Lucide React.
- `lib/api/`: typed API client and endpoint functions; `types/api.ts`: shared types.
- `components/`: page sections and shared layout/UI.
- `public/images/`: local visuals/fallbacks.
- `next.config.ts` permits HTTPS images at `res.cloudinary.com`.

Pages use Server Components for data fetching where possible. `lib/api/client.ts` uses `NEXT_PUBLIC_API_URL`, disables fetch caching for API reads, and maps network/HTTP/JSON/shape failures into the API error abstraction.

## Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_URL=https://osamah-professional-portfolio-mjul.vercel.app/admin/login
```

For production use `NEXT_PUBLIC_API_URL=https://osamah-portfolio-api.onrender.com`. `NEXT_PUBLIC_ADMIN_URL` configures the footer Admin link and defaults to the admin URL above when missing. Both variables are public configuration. Do not put credentials, database settings, JWT secrets, Cloudinary secrets, or `ADMIN_SESSION_SECRET` here.

## Install and run

From `frontend/` in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
# Configure NEXT_PUBLIC_API_URL for the intended backend.
npm run dev
```

The dev server defaults to `http://localhost:3000`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | `next dev --webpack` |
| `npx tsc --noEmit` | TypeScript check; no package typecheck script exists. |
| `npm run lint` | `eslint .` |
| `npm run build` | `next build --webpack` |
| `npm start` | Start after a production build. |

## Vercel deployment

Use the public frontend Vercel project and set **Root Directory** to `frontend`. Configure:

```text
NEXT_PUBLIC_API_URL=https://osamah-portfolio-api.onrender.com
NEXT_PUBLIC_ADMIN_URL=https://osamah-professional-portfolio-mjul.vercel.app/admin/login
```

The public production URL is not recorded in this repository; confirm it from Vercel before sharing. Add the public site's browser origin to backend `FRONTEND_URL` where CORS is required. No Vercel project configuration is checked in; these are dashboard settings.

## Resume and media

The Home page uses `profile.resume_url` directly in a new tab; it does not fetch the PDF, create a Blob, or use a custom viewer. Inline display depends on Cloudinary PDF delivery configuration and response headers. Images may be local or public HTTPS Cloudinary URLs. New PDF uploads use Cloudinary resource type `image`; backend deletion supports legacy `raw` PDFs.

## Validation and limitations

Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`. These do not verify live API, database, Cloudinary, or PDF response behavior. Backend schema provisioning and credentials are external to this app. Windows/OneDrive `.next` `EPERM` has occurred; check the exact error rather than changing architecture around the filesystem issue.
