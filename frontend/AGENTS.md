# Public frontend agent instructions

## Application boundary and routes

This directory is the public Next.js App Router application only. Its routes are `/`, `/projects`, `/projects/[slug]`, and `/certificates`. Do not build or move admin CMS routes here. Do not edit `portfolio-backend/` or the admin app for a public-site task unless the user explicitly requests a coordinated contract change.

Before changing code, inspect the relevant existing implementation and the FastAPI route/schema contract. Do not recreate existing functionality or guess endpoint names/fields.

## Server/client components

- Keep pages and portfolio data fetching in Server Components by default.
- Use a Client Component only for genuine browser interaction/animation state. Keep client boundaries narrow; `Navbar` and `Reveal` already provide existing interaction patterns.
- Avoid client state/effects for data that can be loaded at the page/server boundary.
- Read the installed Next.js documentation under `node_modules/next/dist/docs/` for applicable APIs and version-specific guidance before code changes; preserve the generated Next rules in this file.

## API and type rules

- Use existing functions in `lib/api/` and types in `types/api.ts`; do not introduce duplicate/raw page-level fetch logic.
- `NEXT_PUBLIC_API_URL` is the only current frontend API configuration. Do not hardcode localhost in source or add credentials to public env.
- Verify method/path, nullability, ordering and response fields from backend routes/schemas. The typed GET client checks top-level object/array shape; do not treat it as deep runtime validation.
- Keep API failures sanitized through `ApiError`; do not display raw backend bodies, exception text or secrets. Log only safe error categories/status as existing pages do.
- Respect backend `featured` and `display_order` behavior; do not synthesize fake records or arbitrary top-N filters.

## Design, images and accessibility

- Reuse current editorial graphite/off-black, off-white and copper palette, typography, spacing, borders and UI components. Do not redesign unrelated sections.
- Keep layouts responsive and robust for zero/one/many records, long copy and missing optional values.
- Use Next `Image` for local/remote images and the existing Cloudinary HTTPS host allowlist. Add only a verified, public remote hostname if needed; never expose provider credentials.
- Preserve meaningful alt text, semantic headings/landmarks, skip navigation, keyboard access, visible focus and status roles.
- Keep loading, error and empty states distinct and understandable. Do not insert fake content for loading.

## Security and prohibited changes

- Never add backend JWT secrets, Cloudinary secrets, database credentials, or `ADMIN_SESSION_SECRET` here.
- Do not implement admin authentication or CRUD in this public application.
- Do not modify backend API contracts without checking the admin and public consumers.
- Avoid unnecessary dependencies, duplicate API clients, `any`, mock portfolio data and unrelated refactors.
- Preserve existing route URLs and URL encoding behavior.

## Validation

From this directory, run `npm run lint`, `npx tsc --noEmit`, and `npm run build` when appropriate. Package scripts currently do not define `typecheck`. State whether live API behavior was separately verified. Windows/OneDrive `.next` `EPERM` has occurred intermittently; report the exact error and do not redesign around it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
