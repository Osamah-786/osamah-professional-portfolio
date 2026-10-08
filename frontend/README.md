# Public Portfolio

The Public Portfolio is the visitor-facing Next.js application for the Osamah Professional Portfolio. It renders portfolio content from the FastAPI Backend; it does not connect directly to MySQL or Cloudinary and does not implement admin authentication.

## Technology and structure

- Next.js App Router (`next` dependency range `^16.0.0`), React/React DOM 19.
- TypeScript, Tailwind CSS 4, Framer Motion, and Lucide React.
- Next.js `Image` for local and approved remote images.
- `npm ci` installs dependencies from `package-lock.json`.

```text
app/                  Home, project archive/detail, certificate archive, global styles
components/home/      Home sections and portfolio content presentation
components/layout/    Navigation, route navigation helpers, footer
components/ui/        Shared layout, button, badge, reveal, and section components
lib/api/              Typed API client and endpoint functions
types/                Backend API types and view types
public/images/        Local design/fallback imagery; not mock portfolio records
```

The design system uses graphite/near-black, off-white, a restrained copper accent, thin dividers, and editorial typography. Data pages are Server Components. Client components are reserved for actual interactions and animation. Layouts include responsive behavior, keyboard focus styling, skip navigation, and reduced-motion handling.

## Routes and data flow

| Route | Backend data and behavior |
|---|---|
| `/` | Fetches profile, featured projects, experience, skill categories, skills, featured certificates, achievements, and social links through typed API functions. Independent requests run concurrently; sections handle unavailable/empty data separately, with a minimal profile fallback. |
| `/projects` | Loads the project collection from `GET /api/projects`, preserving backend order and featured state. Detail links use the project's `slug`; GitHub and live-demo links use their respective external URLs. |
| `/projects/[slug]` | Calls `getProjectBySlug(slug)` → `GET /api/projects/{slug}`. Metadata and page data use the same cached loader. A missing project becomes a 404; other failures get an unavailable state. |
| `/certificates` | Loads `GET /api/certificates`; issue dates are formatted for display and empty/unavailable states are distinct. |

The Home page also uses `GET /api/projects/featured`, `GET /api/experience`, `GET /api/skill-categories`, `GET /api/skills`, `GET /api/certificates/featured`, `GET /api/achievements`, and `GET /api/social-links`. Project `live_url` and `github_url` values are external links; internal detail navigation uses `slug`.

Portfolio records, profile information, and social links are API-driven. Page headings, section descriptions, contact labels, and presentation content remain in the frontend. Fallback illustrations under `public/images/` do not represent seeded portfolio data.

## API client

`lib/api/client.ts` provides `apiGet`, which builds URLs from `NEXT_PUBLIC_API_URL`, requires a valid absolute HTTP(S) URL without embedded credentials, sends uncached requests, and maps network/HTTP/JSON/shape errors to `ApiError`. Endpoint modules under `lib/api/` correspond to backend resources; shared response types are in `types/api.ts`.

The client checks the top-level object or array shape but does not deeply validate every field at runtime. Keep paths and types aligned with FastAPI route/schema source. Pages and child presentation components use the typed functions rather than duplicating raw fetch logic.

## Profile, resume, and media

The Home page requests `GET /api/profile` and passes the returned profile to `Hero`. Optional profile fields are omitted when absent. The Resume link uses `profile.resume_url` directly, opens it in a new tab, and does not fetch the PDF or create a Blob. There is no Next.js resume proxy or custom PDF viewer. The browser receives the Cloudinary response; inline display depends on PDF delivery being enabled and Cloudinary returning appropriate PDF response headers.

Admin uploads send file bytes through an authenticated server-side Next.js handler to FastAPI. New PDFs are uploaded to Cloudinary using the `image` resource type. MySQL stores the resulting URL and media metadata, not the file. The Cloudinary environment must permit PDF delivery. Existing raw PDF URLs can still be used as stored profile URLs.

`next.config.ts` allows local images and HTTPS image URLs under `res.cloudinary.com`. Only public media URLs belong in this app; Cloudinary credentials remain in the backend.

## Environment

Copy `.env.example` to `.env.local` and set the public API base URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_API_URL` is browser-visible and must contain only public configuration. Do not put database credentials, JWT signing keys, Cloudinary API credentials, or `ADMIN_SESSION_SECRET` in this application.

## Development and production commands

Run from this directory:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL in .env.local.
npm run dev
```

The development server defaults to `http://localhost:3000`.

| Command | Package script |
|---|---|
| `npm run dev` | `next dev --webpack` |
| `npm run lint` | `eslint .` |
| `npx tsc --noEmit` | TypeScript check; no dedicated typecheck script exists. |
| `npm run build` | `next build --webpack` |
| `npm start` | `next start` |

For a production deployment, configure the public API base URL, allow the deployed frontend origin in backend `FRONTEND_URL` if needed, use HTTPS, and allow the Cloudinary image host in Next.js if it changes. This repository does not include hosting or deployment configuration.

## Validation notes

TypeScript and ESLint can be checked locally with the commands above. A successful build does not verify live backend, database, Cloudinary, or PDF response headers. MySQL schema provisioning and service credentials are configured outside this frontend.
