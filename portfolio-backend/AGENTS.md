# Backend agent instructions

## Scope and architecture

This app is the FastAPI service under `portfolio-backend/app/`. `main.py` creates the FastAPI app, configures explicit-origin CORS and mounts routers. `config.py` uses Pydantic Settings; `database.py` owns the SQLAlchemy MySQL engine, declarative `Base`, and request-scoped session dependency. Models, Pydantic schemas, routes and shared utilities are separated into their corresponding folders. `tests/test_backend.py` is the route/contract/unit test suite.

Before changing code, inspect the relevant existing implementation and API contract. Do not recreate existing functionality. Check both `frontend/lib/api/` and `Osamah-portfolio-admin-dashboard/lib/api/` before changing public response shapes, URL paths, nullability or auth behavior.

## SQLAlchemy and database rules

- Use SQLAlchemy 2 typed mappings and the existing injected `get_db()` dependency. Do not instantiate ad hoc sessions inside route functions.
- Keep transactions explicit; commit success, roll back failed mutations, and close request sessions through the existing dependency.
- Avoid disclosing DB errors/parameters. Existing engine hides SQL parameters; preserve that behavior and map database failures to sanitized HTTP responses.
- The current app does not call `Base.metadata.create_all()` at startup and has no migration system. Do not add automatic schema creation or pretend migrations exist. Schema provisioning is external.
- Preserve declared unique/index/foreign-key behavior. Skill names are unique per category; deleting a category with skills is rejected.
- There are no broad cross-record ORM relationships except Skill↔SkillCategory. Do not assume a Profile singleton database constraint: route code selects the first profile row.

## Pydantic schemas and validation

- Define request/response contract changes in `app/schemas/` and keep route response models explicit.
- Use existing non-empty trimmed string aliases, `HttpUrl`, Python date types and nullable fields consistently with adjacent schemas.
- Maintain experience date invariants (`currently_working` requires null end date; otherwise end date is required and cannot precede start).
- Preserve partial-update semantics and distinguish omitted fields from explicit null where route code does so.
- Do not invent fields or silently reshape responses to fit one frontend. Coordinate and update both consumers for intentional contract changes.

## Routes and errors

- Match current paths and conventions in `app/routes/`; see `README.md` for the complete endpoint inventory.
- Public GETs stay public unless an explicit requirement changes the access model. Every admin mutation must use `Depends(get_current_admin)`; admin media listing is protected too.
- Return the established response models and status codes (201 create, 204 delete, 404 missing records, 409 existing uniqueness conflicts, 422 schema validation, 503 DB/config outage where applicable).
- Catch database/provider errors only to roll back/compensate and return sanitized errors. Never return traces, secret settings, password hashes or raw provider credentials.
- Do not add a public registration, refresh or token-revocation endpoint unless explicitly requested and designed.

## Authentication and secrets

- Reuse `app/utils/security.py` for Argon2 password hashes and PyJWT access tokens; do not store plaintext passwords or weaken JWT verification.
- `get_current_admin()` requires an HTTP Bearer credential, validates token claims/signature/expiry, and checks that the user still exists.
- `JWT_SECRET_KEY`, MySQL credentials and Cloudinary API key/secret are backend-only. Never copy actual `.env` values into documentation, logs, tests, API responses or frontend code. Use `.env.example` placeholders.
- Do not inspect private `.env` values merely to document variables. `SecretStr` is used for signing/provider secrets; preserve it.
- `FRONTEND_URL` is a comma-separated explicit-origin list; wildcard or empty origins are rejected. Do not loosen CORS to `*` or expose authorization headers to untrusted origins.

## Cloudinary and media

- Cloudinary stores file bytes; MySQL stores URL, public ID, file type, alt text and timestamps. Never store binary files in MySQL.
- Keep provider credentials in backend config only. Use secure URLs and current configured resource types (`image` for supported images, `raw` for PDF).
- Preserve extension, MIME type, content-signature and size validation before upload. Keep cleanup/compensation behavior if a database write fails after provider upload.
- Deletion currently removes provider media before DB metadata; storage deletion failure prevents DB deletion. Preserve or explicitly redesign this consistency policy.
- Add/adjust mocked provider tests for success/failure paths and report live provider verification separately.

## Tests and prohibited changes

- Run `python -B -m unittest discover -v` from this directory after backend changes. Tests use fake DB/session behavior and mocked Cloudinary; they do not establish live DB/provider availability.
- Update OpenAPI contract/auth tests whenever route methods or paths intentionally change.
- Do not introduce unnecessary dependencies, fake portfolio data, direct frontend responsibilities, unrelated refactors, or deployment/DevOps files in a backend feature task.
- Do not claim live MySQL or Cloudinary behavior from unit tests alone. Current audit: 17 tests passed; prior documented MySQL access attempt returned error 1045; real credentials/service were not verified here. Cloudinary calls were mocked.
- FastAPI routes are mounted through `main.py`; add a router there only for a genuinely new route module.
