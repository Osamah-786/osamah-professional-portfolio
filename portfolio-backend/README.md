# FastAPI Backend

FastAPI application for public portfolio reads and administrator operations. Entry point: `app/main.py`. Pydantic validates request/response data; SQLAlchemy uses request-scoped sessions; Cloudinary stores uploaded media files.

## Stack and structure

Python, FastAPI, Uvicorn, Pydantic v2/Pydantic Settings, SQLAlchemy, PyMySQL, Argon2, PyJWT, Cloudinary SDK, and `python-multipart`. Dependencies are listed in `requirements.txt` without version pins.

```text
app/main.py       FastAPI setup, CORS and routers
app/config.py     Environment-backed settings
app/database.py   Engine, SessionLocal, Declarative Base and get_db()
app/models/       SQLAlchemy records
app/schemas/      Pydantic request/response contracts
app/routes/       Auth, portfolio, and media routes
app/utils/        Auth helpers and setup CLI commands
database/schema.sql  One-time MySQL-compatible schema provisioning
tests/            unittest suite with fake database/provider paths
```

## API and OpenAPI

Interactive docs are `/docs` and OpenAPI JSON is `/openapi.json`. There is no custom root or health endpoint; `GET /` returns 404. Public GET routes do not require authentication. Admin mutations and admin media listing use the existing bearer-JWT dependency. Exact field constraints are defined in `app/schemas/` and exposed through OpenAPI.

| Method and path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/login` | Public | Verify username/password and issue access JWT. |
| `PATCH /api/auth/username` | Admin | Change authenticated admin username after current-password verification. |
| `PATCH /api/auth/password` | Admin | Change authenticated admin password after current-password verification. |
| `GET /api/projects`, `/api/projects/featured`, `/api/projects/{slug}` | Public | List, featured list, or fetch a project by slug. |
| `POST /api/admin/projects`; `PUT`/`DELETE /api/admin/projects/{id}` | Admin | Project create/update/delete. |
| `GET /api/experience`, `/api/experience/featured`, `/api/experience/{id}` | Public | Experience lists/item. |
| `POST /api/admin/experience`; `PUT`/`DELETE /api/admin/experience/{id}` | Admin | Experience create/update/delete. |
| `GET /api/certificates`, `/api/certificates/featured`, `/api/certificates/{id}` | Public | Certificate lists/item. |
| `POST /api/admin/certificates`; `PUT`/`DELETE /api/admin/certificates/{id}` | Admin | Certificate create/update/delete. |
| `GET /api/skill-categories`, `/api/skill-categories/{id}` | Public | Skill categories. |
| `GET /api/skills`, `/api/skills/{id}`, `/api/skill-categories/{category_id}/skills` | Public | Skills and skills for a category. |
| `POST /api/admin/skill-categories`; `PUT`/`DELETE /api/admin/skill-categories/{id}` | Admin | Category create/update/delete. |
| `POST /api/admin/skills`; `PUT`/`DELETE /api/admin/skills/{id}` | Admin | Skill create/update/delete. |
| `GET /api/achievements`, `/api/achievements/featured`, `/api/achievements/{id}` | Public | Achievement lists/item. |
| `POST /api/admin/achievements`; `PUT`/`DELETE /api/admin/achievements/{id}` | Admin | Achievement create/update/delete. |
| `GET /api/social-links`, `/api/social-links/{id}` | Public | Social links. |
| `POST /api/admin/social-links`; `PUT`/`DELETE /api/admin/social-links/{id}` | Admin | Social-link create/update/delete. |
| `GET /api/profile` | Public | Read the first profile row; 404 if absent. |
| `PUT /api/admin/profile` | Admin | Update the existing first profile row; does not create one. |
| `GET /api/media/{id}` | Public | Read media metadata. |
| `GET /api/admin/media` | Admin | List media metadata, newest first. |
| `POST /api/admin/media` | Admin | Register external media metadata; no upload. |
| `POST /api/admin/media/upload` | Admin | Upload multipart `file` and optional `alt_text` to Cloudinary and store metadata. |
| `PUT /api/admin/media/{id}`; `DELETE /api/admin/media/{id}` | Admin | Update metadata or delete provider asset and its metadata row. |

Create routes return 201, deletes return 204, and missing records return 404. Database/provider failures are handled without returning raw internal errors.

## Models and database

Models cover users, projects, experiences, certificates, skill categories, skills, achievements, social links, profiles, and media. Category/skill relationship constraints are enforced by the existing schema and database relationship. Profile API behavior is singleton-style (first row by ascending ID); the database does not enforce a singleton key.

The engine uses `URL.create(...)` for PyMySQL connection construction, hides SQL parameters, and enables pool pre-ping. For TLS mode `verify_identity`, it uses Python's default SSL context to validate CA and hostname and recycles pooled connections every 300 seconds. `preferred` is the default and is intended for local MySQL compatibility.

### Schema provisioning

The backend does **not** call `Base.metadata.create_all()` or create tables at startup. There is no migration tool. `database/schema.sql` provides one-time `CREATE TABLE IF NOT EXISTS` statements for `portfolio_db`; it initializes absent tables but is not a migration and does not update an existing schema. Review it and provision the intended database deliberately before starting the app. There is no automatic production schema setup.

For TiDB Cloud, create/select the cluster and database in TiDB Cloud, retrieve the MySQL-compatible host, port, user, and password from the cluster's connection dialog, then set the `MYSQL_*` values in Render. Use `MYSQL_TLS_MODE=verify_identity`. See [TiDB Cloud connection guidance](https://docs.pingcap.com/tidbcloud/connect-to-tidb-cluster-serverless/?plan=starter). Never place actual connection details in this README. To diagnose connection errors, confirm cluster availability, database name, user grants, outbound access, TLS mode, and that no stale connection values are configured. Error 1045 indicates MySQL authentication/authorization failure, not a schema migration.

## Authentication and account management

`POST /api/auth/login` verifies passwords using Argon2 and issues a signed JWT with user ID subject and expiration. The existing `get_current_admin()` dependency validates JWT signature/expiry and reloads the user record. There is no public registration, refresh, or backend logout/revocation endpoint.

Username/password settings use the current JWT subject, require the current password, and reuse the Argon2 verification/hash utilities. Username is unique; duplicate names return 409. New passwords require at least 12 characters and have an input-size bound. The admin's session cookie is managed by the separate Next.js server; expiring that cookie after a password change does not revoke a stateless JWT already copied elsewhere. Do not log passwords, hashes, JWTs, or secrets.

Create an administrator after provisioning the intended schema:

```powershell
python -m app.utils.create_admin --username admin
```

The script prompts for a password and confirmation. Do not pass passwords in shell arguments or commit credentials.

Initialize a missing profile row when appropriate:

```powershell
python -m app.utils.create_profile
```

This command is idempotent: it creates a neutral profile only if none exists. The API has no profile POST and update returns 404 until a row exists. Confirm the active environment points at the intended database before running either setup command.

## Media and Cloudinary

Upload requests arrive from an authenticated same-origin admin handler as multipart form data. FastAPI validates extension, declared MIME type, file signature, non-empty content, and configured size before calling Cloudinary. Supported extensions/types are JPEG/JPG, PNG, WEBP, and PDF. The backend default size limit is 10 MB, configurable from 1 to 100 MB. The admin form currently applies a 4 MiB limit for its Vercel request path.

Image and new PDF uploads use Cloudinary `resource_type="image"`; the stored record contains URL, public ID, type, alt text, and timestamps, never file bytes. If database persistence fails after upload, the route attempts to clean up the new provider asset. Delete removes the provider asset before deleting its metadata row; a provider deletion failure prevents metadata deletion. Legacy raw PDF resource type is inferred from stored delivery URL. PDF viewing depends on Cloudinary account delivery settings and response headers; some accounts may require enabling PDF delivery.

Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from the Cloudinary dashboard in backend/Render settings only. Keep them out of either Next.js environment. See [Cloudinary upload documentation](https://cloudinary.com/documentation/upload_images) and [PDF delivery guidance](https://cloudinary.com/documentation/ts_how_to_upload_manage_and_deliver_pdf_files). To verify safely, use a non-sensitive test asset, verify its database metadata and delivered URL, then delete it through the authenticated media API and confirm cleanup. No production upload claim is made here.

## CORS

`FRONTEND_URL` is a comma-separated list of explicit allowed browser origins; empty values and wildcard origins are rejected. CORS allows credentials, methods GET/POST/PUT/PATCH/DELETE/OPTIONS, and Authorization/Content-Type headers. Add exact local/deployed frontend origins. Keep CORS narrow; it does not replace JWT authorization.

## Environment reference

Use `.env.example` as the local template. Its placeholder values are examples, not production credentials.

| Variable | Purpose and example | Required/use | Visibility |
|---|---|---|---|
| `APP_NAME` | FastAPI title; `Portfolio Backend` | Optional; backend | Non-secret |
| `APP_VERSION` | API version label; `0.1.0` | Optional; backend | Non-secret |
| `DEBUG` | Debug setting; `true` locally | Optional; backend | Non-secret |
| `MYSQL_HOST` | Database host; `<your-tidb-host>` | Required for DB operations; backend | Private configuration |
| `MYSQL_PORT` | Database port; `4000` for TiDB or `3306` for local MySQL | Required for DB operations; backend | Non-secret configuration |
| `MYSQL_USER` | Database username; `<your-tidb-username>` | Required for DB operations; backend | Private configuration |
| `MYSQL_PASSWORD` | Database password; `<your-tidb-password>` | Required for DB operations; backend | Secret |
| `MYSQL_DATABASE` | Schema/database name; `portfolio_db` | Required for DB operations; backend | Non-secret configuration |
| `MYSQL_TLS_MODE` | `preferred` or `verify_identity` | Optional; defaults to preferred; backend | Non-secret configuration |
| `JWT_SECRET_KEY` | JWT signing secret; `<generate-a-strong-secret>` | Required for auth; backend | Secret |
| `JWT_ALGORITHM` | Supported HMAC algorithm, e.g. `HS256` | Optional; backend | Non-secret configuration |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime; default 30 (allowed 1–60) | Optional; backend | Non-secret configuration |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | Required for provider uploads; backend | Account identifier |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Required for provider uploads; backend | Sensitive |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Required for provider uploads; backend | Secret |
| `MEDIA_MAX_UPLOAD_SIZE_MB` | Upload limit; default 10 (allowed 1–100) | Optional; backend | Non-secret configuration |
| `FRONTEND_URL` | Explicit comma-separated origins; e.g. `http://localhost:3000,http://localhost:3001` | Required non-empty CORS config; backend | Public origins |

Keep database, JWT, and Cloudinary credentials out of Git and logs. For production, configure private values in Render's environment settings, not in committed files.

## Local install and run

From `portfolio-backend/` in PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Set local database, JWT, CORS, and Cloudinary settings as needed.
uvicorn app.main:app --reload
```

Base URL: `http://localhost:8000`. Swagger UI: `http://localhost:8000/docs`. OpenAPI: `http://localhost:8000/openapi.json`.

## Tests and local verification

```powershell
python -B -c "from app.main import app; app.openapi()"
python -B -m unittest discover -v
```

The current suite has 29 tests and uses fake database sessions and mocked provider paths. It does not verify live TiDB persistence, DB-backed authentication, or the complete backend media/Cloudinary/database flow.

## Render deployment

The repository contains no Render manifest, service name, linked repository/branch, or verified dashboard configuration. In the Render dashboard, use a Python Web Service with Root Directory `portfolio-backend`, Build Command `pip install -r requirements.txt`, and Start Command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Dependencies are declared in `requirements.txt`; no Python version pin is included. Check Render's current supported runtime or configure the version in its dashboard if needed.

Set DB values (including `MYSQL_TLS_MODE=verify_identity` for TiDB), JWT values, exact `FRONTEND_URL` origins, and Cloudinary values in Render's environment settings. Provision the schema separately before DB-backed service use. A backend URL recorded in project documentation is [osamah-portfolio-api.onrender.com](https://osamah-portfolio-api.onrender.com); service identity and current production health require dashboard/manual verification. `/docs` is available when the service is running. No health-check route exists, so do not configure a nonexistent application health path.

For deployment issues, inspect Render startup logs without printing secrets, confirm working directory and install/start commands, and check environment names, DB grants/TLS, CORS origins, and Cloudinary key/secret pairing. See [Render Web Services](https://render.com/docs/web-services), [environment variables](https://render.com/docs/configure-environment-variables), and [monorepo root directories](https://render.com/docs/monorepo-support).

## Verification status and limitations

- Local backend import and mocked/unit checks are distinct from live service verification.
- Previous DB check reached MySQL but received error 1045; current TiDB authentication and real CRUD remain unverified.
- Direct Cloudinary provider ping/upload/delete previously succeeded, but backend-authenticated upload plus DB persistence and production uploads remain unverified.
- There are no migrations or startup table creation. Review `database/schema.sql` before initial provisioning; it will not upgrade existing schema.
- No Docker, CI/CD, or deployment manifest is checked in.
