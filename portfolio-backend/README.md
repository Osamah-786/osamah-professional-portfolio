# FastAPI Backend

The FastAPI Backend serves the Public Portfolio and Admin Dashboard. It validates requests with Pydantic, persists records through SQLAlchemy/MySQL, issues admin JWTs, and sends uploaded media to Cloudinary.

## Stack and structure

- Python (no Python version is pinned by the repository).
- FastAPI, Pydantic v2, Pydantic Settings.
- SQLAlchemy 2-style typed ORM with MySQL through PyMySQL.
- Argon2 password hashing and PyJWT bearer tokens.
- Cloudinary Python SDK and `python-multipart` for media uploads.
- `unittest` test suite; dependencies are listed without version pins in `requirements.txt`.

```text
app/
  main.py                 FastAPI app, CORS setup, router registration
  config.py               Pydantic Settings and environment configuration
  database.py             SQLAlchemy engine, Base, SessionLocal, request session
  models/                 SQLAlchemy table mappings
  schemas/                Pydantic request and response models
  routes/                 Authentication and portfolio/media endpoints
  utils/                  Auth dependencies, security functions, CLI commands
tests/
  test_backend.py         API, schema, auth, CORS, database/provider mock tests
  test_create_profile.py  Profile initialization CLI tests
requirements.txt
.env.example
```

## Database model

The app uses injected `get_db()` request sessions. The engine hides SQL parameters. Schema provisioning is external: the application does not call `Base.metadata.create_all()` at startup and has no migration tool.

| Table/model | Main data |
|---|---|
| `users` / `User` | Admin username and Argon2 password hash. |
| `projects` / `Project` | Title, unique slug, descriptions, cover, GitHub/live URLs, featured flag, order. |
| `experiences` / `Experience` | Company, role, dates, descriptions, featured flag, order. |
| `certificates` / `Certificate` | Title, issuer, issue date, credential/media URLs, description, featured flag, order. |
| `skill_categories` / `SkillCategory` | Unique category name and display order. |
| `skills` / `Skill` | Name, category ID, optional icon, display order. |
| `achievements` / `Achievement` | Title, descriptions, image/link/date, featured flag, order. |
| `social_links` / `SocialLink` | Platform, URL, optional icon, display order. |
| `profiles` / `Profile` | Profile copy, image, location, email, resume URL. |
| `media` / `Media` | Cloudinary URL/public ID, file MIME type, alt text, timestamps. |

The declared ORM relationship is `SkillCategory.skills` / `Skill.category`; a category with existing skills cannot be deleted. Profile routes select the first profile row by ascending ID. There is no database singleton constraint, so initialize only one profile row for the current editor workflow.

## API and authentication

Interactive OpenAPI documentation is available at `/docs`; JSON schema is at `/openapi.json`. The app has no root endpoint, so `GET /` returns 404. Public reads do not require a token. Admin mutations require `Authorization: Bearer <token>`; admin media listing is also protected.

### Authentication

| Method and path | Auth | Contract |
|---|---|---|
| `POST /api/auth/login` | Public | `LoginRequest` contains `username` and `password`; response contains `access_token` and `token_type`. |

Login verifies the stored Argon2 hash and returns a JWT with `sub` and `exp`. `get_current_admin()` validates the token and loads the corresponding user. There is no registration, refresh, backend logout, or token-revocation endpoint. The Admin Dashboard stores the token in an HttpOnly HMAC-signed cookie and forwards it only from server-side code; that cookie is signed, not encrypted. See the [Admin Dashboard README](../Osamah-portfolio-admin-dashboard/README.md).

### Portfolio endpoints

| Methods and paths | Auth | Purpose |
|---|---|---|
| `GET /api/projects`, `GET /api/projects/featured`, `GET /api/projects/{slug}` | Public | Project collection, featured collection, or one project by slug. |
| `POST /api/admin/projects`, `PUT /api/admin/projects/{id}`, `DELETE /api/admin/projects/{id}` | Admin | Project create, update, and delete. |
| `GET /api/experience`, `GET /api/experience/featured`, `GET /api/experience/{id}` | Public | Experience collection, featured collection, or one record. |
| `POST /api/admin/experience`, `PUT /api/admin/experience/{id}`, `DELETE /api/admin/experience/{id}` | Admin | Experience create, update, and delete. |
| `GET /api/certificates`, `GET /api/certificates/featured`, `GET /api/certificates/{id}` | Public | Certificate collection, featured collection, or one record. |
| `POST /api/admin/certificates`, `PUT /api/admin/certificates/{id}`, `DELETE /api/admin/certificates/{id}` | Admin | Certificate create, update, and delete. |
| `GET /api/skill-categories`, `GET /api/skill-categories/{id}`, `GET /api/skill-categories/{category_id}/skills` | Public | Skill category and category-specific skill reads. |
| `GET /api/skills`, `GET /api/skills/{id}` | Public | Skill collection or one skill. |
| `POST /api/admin/skill-categories`, `PUT /api/admin/skill-categories/{id}`, `DELETE /api/admin/skill-categories/{id}` | Admin | Skill category create, update, and delete. Delete is restricted while skills use the category. |
| `POST /api/admin/skills`, `PUT /api/admin/skills/{id}`, `DELETE /api/admin/skills/{id}` | Admin | Skill create, update, and delete. |
| `GET /api/achievements`, `GET /api/achievements/featured`, `GET /api/achievements/{id}` | Public | Achievement collection, featured collection, or one record. |
| `POST /api/admin/achievements`, `PUT /api/admin/achievements/{id}`, `DELETE /api/admin/achievements/{id}` | Admin | Achievement create, update, and delete. |
| `GET /api/social-links`, `GET /api/social-links/{id}` | Public | Social-link collection or one record. |
| `POST /api/admin/social-links`, `PUT /api/admin/social-links/{id}`, `DELETE /api/admin/social-links/{id}` | Admin | Social-link create, update, and delete. |
| `GET /api/profile` | Public | First profile row by ascending ID; returns 404 when no row exists. |
| `PUT /api/admin/profile` | Admin | Update the existing first profile row; does not create one. |

### Media endpoints

| Method and path | Auth | Purpose / request |
|---|---|---|
| `GET /api/media/{id}` | Public | Read one media metadata record. |
| `GET /api/admin/media` | Admin | List media metadata, newest first. |
| `POST /api/admin/media` | Admin | Register metadata with `MediaCreate`; does not upload bytes. |
| `POST /api/admin/media/upload` | Admin | Multipart upload with required `file` and optional `alt_text`; returns a `MediaResponse`. |
| `PUT /api/admin/media/{id}` | Admin | Update media metadata. |
| `DELETE /api/admin/media/{id}` | Admin | Delete the Cloudinary asset, then its metadata row. |

Portfolio request/response fields are defined in the corresponding modules in `app/schemas/`; resource handlers return the matching `*Response` schema. Successful creates return 201, deletes return 204, and missing records return 404. Authentication, validation, uniqueness, database, and provider failures use the route's 401/409/422/503/502 handling; raw exception details are not returned.

## Cloudinary and media handling

The backend accepts JPG/JPEG, PNG, WEBP, and PDF. Before upload it checks file extension, declared MIME type, file signature, non-empty bytes, and configured size. `MEDIA_MAX_UPLOAD_SIZE_MB` defaults to 10 MB and permits values from 1 to 100 MB.

Images and PDFs are uploaded to Cloudinary with `resource_type="image"`. In particular, new PDF uploads use the image resource type. Cloudinary must allow PDF delivery in the product environment. The backend stores the returned `secure_url`, Cloudinary `public_id`, original MIME type (for a PDF: `application/pdf`), optional alt text, and timestamps in `media`; bytes are not stored in MySQL.

If metadata insertion fails after upload, the backend attempts to delete the just-uploaded Cloudinary object using the same resource type used for that upload. On deletion, image records use `image`; PDF records infer `image` or legacy `raw` from the stored Cloudinary delivery URL path, so older raw PDFs remain deletable without adding a schema column. Provider deletion happens before metadata deletion; provider failure leaves the database row in place.

The Profile editor stores a separate `profiles.resume_url` reference. A successful upload updates the editor draft; the administrator must then save the profile for `PUT /api/admin/profile` to persist that URL. The Public Portfolio reads it from `GET /api/profile` and navigates directly to Cloudinary. Inline PDF viewing depends on the provider response headers and PDF delivery configuration.

Cloudinary account credentials are backend-only. Neither frontend receives the API secret or uploads directly to Cloudinary.

## Configuration

Copy `.env.example` to `.env` and set private values for the local environment. Variable names and purposes:

| Variable | Purpose |
|---|---|
| `APP_NAME`, `APP_VERSION` | FastAPI metadata. |
| `DEBUG` | Application debug setting. |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | MySQL connection settings. |
| `JWT_SECRET_KEY` | Private JWT signing key. |
| `JWT_ALGORITHM` | JWT HMAC algorithm; supported values are HS256, HS384, HS512. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime, constrained to 1–60 minutes. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-side Cloudinary configuration; key/secret are secret values. |
| `MEDIA_MAX_UPLOAD_SIZE_MB` | Upload limit, constrained to 1–100 MB. |
| `FRONTEND_URL` | Comma-separated explicit CORS origins. Wildcards and an empty origin list are rejected. |

Do not put real secrets in documentation, source control, logs, or either frontend. `FRONTEND_URL` must include each browser origin that calls the backend; the local frontend and admin use different ports when run together.

## Install, initialize, and run

From this directory in PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Configure .env and provision the MySQL schema separately.
```

Create the initial profile row once, when needed. The command is idempotent and leaves an existing profile untouched:

```powershell
python -m app.utils.create_profile
```

Create an administrator after the database schema is ready. The username is supplied as an option; password and confirmation are prompted interactively:

```powershell
python -m app.utils.create_admin --username admin
```

Run the API:

```powershell
uvicorn app.main:app --reload
```

The default development URL is `http://localhost:8000`; OpenAPI docs are at `http://localhost:8000/docs`.

## Tests and verification

Run from this directory:

```powershell
python -B -c "from app.main import app; app.openapi()"
python -B -m unittest discover -v
```

The current suite contains 20 passing tests. It exercises route/schema contracts, auth, CORS, fake sessions, media validation, resource-type selection, cleanup, and mocked Cloudinary operations. It does not connect to a live MySQL database or Cloudinary account.

## Operational limits

- MySQL schema provisioning is external; there is no migration system or automatic table creation.
- No deployment, Docker/Compose, or CI/CD setup is included in this backend project.
- A successful unit test or OpenAPI import does not establish live credentials, persistence, or Cloudinary delivery behavior.
- Frontend development/build commands are documented in the [Public Portfolio README](../frontend/README.md) and [Admin Dashboard README](../Osamah-portfolio-admin-dashboard/README.md).
