# Portfolio Section Builder

## Overview

The builder stores section configuration in `portfolio_sections`; it does not copy portfolio records into a second content store. Built-in keys point to the existing profile, experience, projects, skills, certificates, achievements, social links, and contact sections. Custom sections use validated JSON content blocks and configurable field definitions/values.

Built-ins are seeded once by the schema SQL. Hiding, unpublishing, archiving, or deleting data is not allowed through a built-in section record: built-in entries cannot be deleted, and their underlying content remains in its original table. Custom deletion removes only the registry row.

## Registry fields and validation

Each record has a unique key, slug, and title, built-in/custom type, enabled state, draft/published/archived status, display order, homepage/full-page visibility, short and long descriptions, Read More state, layout variant, optional cover image with alt text, SEO title/description/canonical slug/social image, timestamps, and JSON blocks/custom fields/values.

Layouts: `standard`, `cards`, `split`, `editorial`, `full_width`.

Custom blocks: `heading`, `paragraph`, `list`, `image`, `gallery`, `links`, `quote`, `callout`. Text/Markdown is rendered as text; arbitrary HTML is not accepted. Images and files are URL references; use the existing media management workflow to upload assets and then reference their URL. The builder does not implement a second upload path.

Custom field types: `text`, `textarea`, `rich_text` (plain text rendering), `url`, `date` (`YYYY-MM-DD`), `number`, `tags`, `image`, `file`, `links`. Names must be unique. Values are type-checked; URLs permit HTTP/HTTPS. Limits include 100 blocks, 30 configured fields, 100 KB serialized block/value content, 10,000 characters per text value, and a maximum five-level value nesting depth.

## API

Public endpoints return only enabled and published records that match the requested visibility. The detail endpoint additionally requires full-page visibility and Read More enabled.

| Method and path | Access | Purpose |
|---|---|---|
| `GET /api/sections?placement=home\|full` | Public | Ordered visible registry entries for a placement. |
| `GET /api/sections/{slug}` | Public | Visible detail-page section configuration. |
| `GET /api/admin/sections` | Admin JWT | List all entries, ordered by display order then ID. |
| `GET /api/admin/sections/{id}` | Admin JWT | Fetch one entry. |
| `POST /api/admin/sections` | Admin JWT | Create a custom or built-in configuration. |
| `PUT /api/admin/sections/{id}` | Admin JWT | Partial update; omitted fields are retained and the merged result is revalidated. |
| `DELETE /api/admin/sections/{id}` | Admin JWT | Delete custom registry entry only; built-in deletion is rejected. |
| `POST /api/admin/sections/{id}/duplicate` | Admin JWT | Create a draft duplicate. |
| `PUT /api/admin/sections/reorder` | Admin JWT | Submit all registry IDs in the desired order. |

The admin dashboard calls these through same-origin Next.js handlers. JWT extraction and forwarding stay server-side.

## Local setup and testing

Apply the SQL before using the registry. Then start the backend and both Next.js apps using their application READMEs. The public page uses the legacy source layout if the registry request fails; a successful empty registry intentionally renders no sections. Run backend `python -B -m unittest discover -v`, admin `npm run typecheck` and `npm run lint`, and public frontend `npx tsc --noEmit` and `npm run lint`.

## Database migration and rollback

There is no automated migration runner. Back up TiDB first, review `portfolio-backend/database/migrations/001_create_portfolio_sections.sql`, and apply it once using the approved MySQL-compatible client. It creates one new table and idempotently seeds built-in registry rows; it does not alter or remove existing content tables. Do not run `Base.metadata.create_all()` as a migration.

To roll back, first disable registry-driven homepage rendering by deploying the prior frontend version. If custom sections are no longer needed, export or retain their content before removing the table. Dropping `portfolio_sections` removes registry configuration and custom block/field content; it does not affect the existing content tables. Do not drop the table without a backup and an explicit rollback decision.

## Deployment

1. Back up TiDB and apply the migration before deploying code that expects the registry table.
2. Deploy `portfolio-backend` to Render with its existing environment variables and database TLS configuration. No new secret is introduced. Verify `/docs`, the section routes, and database-backed behavior after deployment.
3. Deploy the public `frontend` Vercel project with `NEXT_PUBLIC_API_URL` pointing to the backend. `NEXT_PUBLIC_ADMIN_URL` may continue to point to the existing admin app.
4. Deploy `Osamah-portfolio-admin-dashboard` to its Vercel project with `NEXT_PUBLIC_API_URL` and the existing server-only `ADMIN_SESSION_SECRET`. Keep backend credentials and session values out of client configuration.
5. Existing Cloudinary settings and media upload flow are unchanged. Upload artwork through the existing Media page and use its HTTPS URL in section configuration.

The repository does not verify Render/Vercel dashboard settings or live TiDB and Cloudinary section integration. Validate those in the deployed environments before relying on the feature.

## Known limits and troubleshooting

- Built-in entries reorder and control visibility, but their components retain their existing content-specific presentation titles/layout. Custom section layout variants are stored in configuration; the current renderer uses the portfolio's standard responsive typography and block layout.
- The current detail page displays custom long-form content and the built-in Profile biography. Other built-in detail pages show a link-back explanation rather than duplicating their full data components.
- The admin editor manages content blocks and custom field JSON as structured JSON, rather than providing a rich visual block editor. Rich text fields are rendered as escaped text, not HTML/Markdown.
- Cover and block image fields accept URLs; the editor does not yet provide a media-picker control. The existing upload manager remains the upload surface.
- If the admin reports an unavailable registry, apply the migration and confirm backend DB connectivity. A 409 indicates a duplicate slug/key. A 422 indicates invalid block, custom-field, URL, or size constraints. Public drafts/hidden/archived entries are filtered out by the API.
