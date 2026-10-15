# Public Portfolio

The public site is a visitor-facing Next.js App Router application. It renders portfolio content from FastAPI and does not connect directly to MySQL or Cloudinary.

## Stack and structure

- Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion, and Lucide React.
- `app/` contains App Router pages; `components/` contains page sections and shared UI; `lib/api/` contains typed API calls; `types/api.ts` defines response types.
- `next.config.ts` allows remote images from `res.cloudinary.com`.

## Routes and dynamic content

| Route | Current behavior |
|---|---|
| `/` | Loads the section registry and existing content APIs; registry order controls registered homepage sections. If registry loading fails, the prior homepage layout is used. |
| `/about` | Displays the profile's full biography when present, plus available experience, projects, skills, certificates, achievements, and social links from the existing public API. |
| `/projects` | Displays the project archive returned by the backend. |
| `/projects/[slug]` | Fetches a project by slug; missing entries render not-found. |
| `/certificates` | Displays backend certificates with empty and unavailable states. |
| `/sections/[slug]` | Displays eligible published custom sections and the built-in profile biography when full-page visibility and Read More are enabled. |

Portfolio records are API-driven through typed functions in `lib/api/`; layout, labels, and presentation copy are frontend content. Components alone do not imply CMS configurability. Local fallback assets are presentation fallbacks, not mock portfolio records.

The homepage uses the published section registry at `GET /api/sections?placement=home` to order and show enabled, published built-in sections and custom block sections marked for homepage visibility. Hidden, draft, archived, and placement-ineligible records are omitted by the API. If registry loading fails, the existing homepage layout is used; a successful empty registry does not synthesize sections. See [the Section Builder guide](../docs/section-builder.md) for migration and rendering limits.

The home hero displays the API profile's `short_bio` and links to `/about`. The full-profile page uses `full_bio` and the existing public endpoints; its project summaries link to the existing project detail route and configured external links. Education is not shown because the current backend has no education model, schema, or endpoint. Administrators edit both biography fields in the existing Profile editor; both are saved through the authenticated `PUT /api/admin/profile` endpoint. No new API or database migration is required.

## Image presentation

Featured and archive project cards use fixed 16:9 image containers, centered `object-fit: contain` images, neutral dark surfaces, and responsive widths. Featured lead and supporting cards keep their intentional different widths while retaining consistent image framing. `ImageWithFallback` preserves alt text and shows a fallback when an image fails.

Experience logos are centered and contained in responsive 80–112px frames, with company initials as an on-error fallback. Certificate and achievement artwork uses contained imagery and fallback presentation. Social link logos load from their configured URL and fall back to a platform icon. Profile and resume image references are delivered by the backend/Cloudinary; the site does not upload files.

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Use | Required | Exposure | Example |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for FastAPI public reads | Yes for live content | Public | `http://localhost:8000` |
| `NEXT_PUBLIC_ADMIN_URL` | Footer link to admin login; source has a default if omitted | No | Public | `https://<admin-domain>/admin/login` |

Production API URL recorded in project docs: `https://osamah-portfolio-api.onrender.com`. This value and the admin URL are configuration references; current production availability has not been confirmed. Do not place secrets in either variable.

## Install and run

From `frontend/` in PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL for the backend you intend to use.
npm run dev
```

The development server defaults to `http://localhost:3000`.

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js development server with Webpack. |
| `npx tsc --noEmit` | TypeScript check; there is no package `typecheck` script. |
| `npm run lint` | Runs `eslint .` |
| `npm run build` | Production build with Webpack. |
| `npm start` | Serves a completed production build. |

## Vercel

Use the public portfolio Vercel project and set **Root Directory** to `frontend`. The project name `osamah-professional-portfolio` is recorded in task/project documentation, but the Vercel project ID, linked Git repository, production branch, custom domain, and current deployment status are not verified from repository configuration; confirm them in Vercel.

Configure `NEXT_PUBLIC_API_URL` to the intended backend base URL. `NEXT_PUBLIC_ADMIN_URL` may point to the admin login. These `NEXT_PUBLIC_*` settings are browser-visible and must contain no credentials. Add the deployed public site's exact origin to backend `FRONTEND_URL` if browser requests require CORS.

There is no checked-in Vercel project configuration. Confirm the framework/build settings in the dashboard, deploy from the intended branch, then verify the deployment is Ready and check the deployed routes and API behavior. A repository build alone does not verify deployment.

## Troubleshooting and limits

- **Missing/delayed content:** verify `NEXT_PUBLIC_API_URL` and backend reachability. The page uses independent section requests; an API failure may affect one section only.
- **Missing remote image:** check that the URL is valid and HTTPS, the host is permitted by Next image configuration, and the backend record points to the intended asset. Fallback behavior does not repair a bad URL.
- **Build errors:** run commands from `frontend/` and inspect the exact error. Windows/OneDrive has produced `.next` EPERM filesystem failures in this workspace.
- **PDF resume:** the site links to the configured URL; inline display depends on Cloudinary PDF delivery and response headers. The frontend does not process or upload the PDF.
- **Verification boundary:** TypeScript, lint, and build checks do not establish live API, database, image-provider, or deployment behavior.
