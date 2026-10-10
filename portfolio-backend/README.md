# FastAPI Backend

The FastAPI Backend serves the public portfolio and admin dashboard. It validates requests with Pydantic, persists structured records through SQLAlchemy and a MySQL-compatible database, issues admin JWTs, and coordinates media operations with Cloudinary.

## Stack and structure

Python (not pinned), FastAPI, Pydantic v2/Pydantic Settings, SQLAlchemy, PyMySQL, Argon2, PyJWT, Cloudinary SDK, and `python-multipart`. Dependencies are listed without version pins in `requirements.txt`.

```text
app/main.py       FastAPI app, CORS, router registration
app/config.py     environment-backed Pydantic Settings
app/database.py   SQLAlchemy engine, Base, SessionLocal, get_db()
app/models/       ORM models
app/schemas/      request/response contracts
app/routes/       authentication, content, and media endpoints
app/utils/        authentication helpers and CLI initializers
tests/            unittest suite with fake DB/provider paths
```

## Database and schema

Models map `users`, `projects`, `experiences`, `certificates`, `skill_categories`, `skills`, `achievements`, `social_links`, `profiles`, and `media`. The declared SQLAlchemy relationship is SkillCategory-to-Skill; a category with skills cannot be deleted. Profile handlers select the first row ordered by ascending ID; no singleton constraint is enforced by the database.

Routes use request-scoped sessions from `get_db()`. `URL.create(...)` builds the PyMySQL URL, SQL parameters are hidden, and the engine uses pool pre-ping. The app does not call `Base.metadata.create_all()` at startup and has no migration tool. Provision tables/schema separately.

### TiDB TLS

`MYSQL_TLS_MODE` accepts `preferred` or `verify_identity`. The default `preferred` preserves local MySQL compatibility. Set `MYSQL_TLS_MODE=verify_identity` for TiDB Cloud: the engine passes Python's default SSL context to PyMySQL, verifying the certificate chain and hostname, and recycles pooled connections every 300 seconds. Do not disable TLS verification to work around connection failures.

## API inventory

OpenAPI JSON is at `/openapi.json`; interactive docs are at `/docs`. There is no custom root endpoint (`GET /` returns 404). Public reads need no token. Admin operations require `Authorization: Bearer <JWT>`. Creates return 201, deletes 204, and missing records 404. Full fields/nullability are in `app/schemas/` and generated OpenAPI.

| Method and path | Auth | Purpose / contract summary |
|---|---|---|
| `POST /api/auth/login` | Public | JSON `username`, `password`; returns `access_token`, `token_type`. |
| `GET /api/projects`, `/api/projects/featured`, `/api/projects/{slug}` | Public | Project arrays or one project. |
| `POST /api/admin/projects`, `PUT /api/admin/projects/{id}`, `DELETE /api/admin/projects/{id}` | Admin | Project create/update/delete using project schemas. |
| `GET /api/experience`, `/api/experience/featured`, `/api/experience/{id}` | Public | Experience arrays or one record. |
| `POST /api/admin/experience`, `PUT /api/admin/experience/{id}`, `DELETE /api/admin/experience/{id}` | Admin | Experience create/update/delete. |
| `GET /api/certificates`, `/api/certificates/featured`, `/api/certificates/{id}` | Public | Certificate arrays or one record. |
| `POST /api/admin/certificates`, `PUT /api/admin/certificates/{id}`, `DELETE /api/admin/certificates/{id}` | Admin | Certificate create/update/delete. |
| `GET /api/skill-categories`, `/api/skill-categories/{id}`, `/api/skill-categories/{category_id}/skills` | Public | Skill categories and category skills. |
| `GET /api/skills`, `/api/skills/{id}` | Public | Skill array or one skill. |
| `POST /api/admin/skill-categories`, `PUT /api/admin/skill-categories/{id}`, `DELETE /api/admin/skill-categories/{id}` | Admin | Category create/update/delete; delete is constrained if skills use it. |
| `POST /api/admin/skills`, `PUT /api/admin/skills/{id}`, `DELETE /api/admin/skills/{id}` | Admin | Skill create/update/delete. |
| `GET /api/achievements`, `/api/achievements/featured`, `/api/achievements/{id}` | Public | Achievement arrays or one record. |
| `POST /api/admin/achievements`, `PUT /api/admin/achievements/{id}`, `DELETE /api/admin/achievements/{id}` | Admin | Achievement create/update/delete. |
| `GET /api/social-links`, `/api/social-links/{id}` | Public | Social-link array or one record. |
| `POST /api/admin/social-links`, `PUT /api/admin/social-links/{id}`, `DELETE /api/admin/social-links/{id}` | Admin | Social-link create/update/delete. |
| `GET /api/profile` | Public | First profile row; 404 when absent. |
| `PUT /api/admin/profile` | Admin | Update existing first profile row; does not create it. |
| `GET /api/media/{id}` | Public | One media metadata record. |
| `GET /api/admin/media` | Admin | Media inventory, newest first. |
| `POST /api/admin/media` | Admin | Register `MediaCreate` metadata; does not upload bytes. |
| `POST /api/admin/media/upload` | Admin | Multipart required `file`, optional `alt_text`; returns media metadata. |
| `PUT /api/admin/media/{id}` | Admin | Update media metadata. |
| `DELETE /api/admin/media/{id}` | Admin | Delete provider asset then metadata row. |

Responses use the appropriate `*Response` schema or array. Database/provider exceptions return generic client responses; diagnostics are logged server-side with sensitive values redacted. CORS allows explicit comma-separated `FRONTEND_URL` origins, credentials, GET/POST/PUT/DELETE/OPTIONS, and Authorization/Content-Type headers.

## Authentication and admin setup

Login verifies an Argon2 password hash and returns a JWT with subject and expiry. Protected dependencies validate token signature/expiry and reload the admin record. There is no registration, refresh, backend logout, or revocation endpoint.

Create an administrator after schema provisioning:

```powershell
python -m app.utils.create_admin --username admin
```

The command prompts for password and confirmation. Do not put passwords in shell history or documentation. The admin dashboard stores the backend JWT in its server-managed signed HttpOnly cookie; see its README.

## Profile initialization

`PUT /api/admin/profile` is update-only. If no row exists, run the idempotent initializer once:

```powershell
python -m app.utils.create_profile
```

It creates a neutral row only when missing and leaves existing profile data untouched. Confirm the active backend environment points to the intended database, especially in production.

## Media and Cloudinary

Uploads accept JPG/JPEG, PNG, WEBP, and PDF. The backend checks extension, declared MIME type, file signature, non-empty content, and `MEDIA_MAX_UPLOAD_SIZE_MB` (default 10 MB, range 1–100 MB). New image and PDF assets use Cloudinary `resource_type="image"`; PDF MIME metadata remains `application/pdf`. Cloudinary must permit PDF delivery.

MySQL stores Cloudinary URL/public ID, MIME/file type, alt text, and timestamps, not file bytes. If metadata persistence fails after upload, cleanup attempts to delete the new Cloudinary asset. Deletion infers `image` or legacy `raw` PDF resource type from the stored delivery URL; older raw PDFs remain deletable without a schema change. The profile's `resume_url` is a separate reference and must be saved after upload. Browser inline PDF display depends on Cloudinary delivery headers.

Cloudinary API credentials remain backend-only. Do not upload directly to Cloudinary from browser code.

## Environment variables

Copy `.env.example` to `.env` and set private values:

| Variable | Purpose |
|---|---|
| `APP_NAME`, `APP_VERSION`, `DEBUG` | Application metadata/debug setting. |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | MySQL/TiDB connection. |
| `MYSQL_TLS_MODE` | `preferred` or `verify_identity`; use verified mode for TiDB Cloud. |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT signing/expiry; supported algorithms HS256/384/512, expiry 1–60 minutes. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Backend Cloudinary settings. |
| `MEDIA_MAX_UPLOAD_SIZE_MB` | Upload cap, 1–100 MB. |
| `FRONTEND_URL` | Comma-separated explicit browser origins; wildcard/empty is rejected. |

Never include real secrets in docs, source control, logs, or either frontend. Set deployment credentials in Render environment settings.

## Local install and run

From `portfolio-backend/` in PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Configure local MySQL/JWT/CORS and Cloudinary if using uploads.
# Provision the database schema separately.
uvicorn app.main:app --reload
```

Default URL: `http://localhost:8000`; docs: `/docs`.

## Tests

```powershell
python -B -c "from app.main import app; app.openapi()"
python -B -m unittest discover -v
```

The current suite has 26 passing tests. Fake sessions and mocked provider calls cover integration-sensitive code; the suite does not verify live TiDB persistence or backend-mediated Cloudinary operations.

## Render deployment

Configure the Render Web Service:

```text
Root Directory: portfolio-backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set database credentials, `MYSQL_TLS_MODE=verify_identity`, JWT configuration, explicit `FRONTEND_URL`, and Cloudinary variables in Render. Provision the schema before serving requests. The supplied API URL is `https://osamah-portfolio-api.onrender.com`. No Render manifest is checked in; service settings live in Render.

## Limits and security

- No schema creation or migrations occur at startup; provision schema externally.
- Prior recorded live DB verification reached MySQL but received authentication error 1045; recheck current TiDB credentials/permissions. Unit tests do not prove production connectivity.
- Direct Cloudinary provider verification previously succeeded, but backend upload plus DB persistence is not established by that check.
- Keep TLS verification enabled for TiDB. Keep DB/JWT/Cloudinary/session secrets out of docs, client bundles, and logs.
- No Docker, CI/CD, or automated deployment configuration is included.
