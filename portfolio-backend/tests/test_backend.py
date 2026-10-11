from io import BytesIO
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import SecretStr, ValidationError

from app.config import settings
from app.config import Settings
from app.main import app
from app.models.achievement import Achievement
from app.models.certificate import Certificate
from app.models.experience import Experience
from app.models.media import Media
from app.models.profile import Profile
from app.models.project import Project
from app.models.skill import Skill, SkillCategory
from app.models.social_link import SocialLink
from app.models.user import User
from app.routes import achievements, auth, certificates, experience, media, profile, projects, skills, social_links
from app.schemas.achievement import AchievementCreate
from app.schemas.auth import PasswordChangeRequest, UsernameChangeRequest
from app.schemas.certificate import CertificateCreate
from app.schemas.experience import ExperienceCreate
from app.schemas.media import MediaCreate, MediaUpdate
from app.schemas.profile import ProfileUpdate
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.skill import SkillCategoryCreate, SkillCreate
from app.schemas.social_link import SocialLinkCreate
from app.utils.dependencies import get_current_admin
from app.utils.security import create_access_token, hash_password, verify_password


class FakeDB:
    """Small deterministic session double; it never opens a connection."""

    def __init__(self, *, records=None, scalar_results=None, list_results=None, fail_commit=False):
        self.records = records or {}
        self.scalar_results = list(scalar_results or [])
        self.list_results = list(list_results or [])
        self.fail_commit = fail_commit
        self.added = []
        self.deleted = []
        self.statements = []
        self.commits = 0
        self.rollbacks = 0

    def get(self, model, key):
        return self.records.get((model, key))

    def scalar(self, _statement):
        return self.scalar_results.pop(0) if self.scalar_results else None

    def scalars(self, _statement):
        self.statements.append(str(_statement))
        values = self.list_results.pop(0) if self.list_results else []
        return type("Result", (), {"all": lambda _self: values})()

    def add(self, value):
        value.id = getattr(value, "id", None) or len(self.added) + 1
        self.added.append(value)

    def commit(self):
        if self.fail_commit:
            from sqlalchemy.exc import SQLAlchemyError
            raise SQLAlchemyError("mock database failure")
        self.commits += 1

    def refresh(self, value):
        now = datetime.now(timezone.utc)
        if hasattr(value, "created_at") and getattr(value, "created_at", None) is None:
            value.created_at = now
        if hasattr(value, "updated_at") and getattr(value, "updated_at", None) is None:
            value.updated_at = now

    def rollback(self):
        self.rollbacks += 1

    def delete(self, value):
        self.deleted.append(value)


class BackendValidationTests(unittest.TestCase):
    def setUp(self):
        self.secret_patch = patch.object(settings, "jwt_secret_key", SecretStr("unit-test-secret-key-long-enough-for-hs256"))
        self.secret_patch.start()

    def tearDown(self):
        self.secret_patch.stop()

    def test_openapi_contains_expected_routes_and_no_database_startup_hook(self):
        paths = app.openapi()["paths"]
        for route in (
            "/api/projects", "/api/experience", "/api/certificates", "/api/skills",
            "/api/skill-categories", "/api/achievements", "/api/social-links", "/api/profile",
            "/api/media/{id}", "/api/admin/media/upload", "/api/auth/login",
        ):
            self.assertIn(route, paths)
        self.assertNotIn("security", paths["/api/media/{id}"]["get"])
        self.assertIn("security", paths["/api/admin/media/upload"]["post"])
        self.assertFalse(any(hasattr(handler, "__name__") and "create_all" in handler.__name__
                             for handler in app.router.on_startup))
        source_root = Path(__file__).resolve().parents[1] / "app"
        self.assertFalse(any("Base.metadata.create_all" in source.read_text(encoding="utf-8")
                             for source in source_root.rglob("*.py")))

    def test_route_authentication_and_admin_status_code_contracts(self):
        for path, operations in app.openapi()["paths"].items():
            for method, operation in operations.items():
                if method not in {"get", "post", "put", "delete"}:
                    continue
                if path.startswith("/api/admin/"):
                    self.assertIn("security", operation, f"Missing admin auth: {method.upper()} {path}")
                    if method == "delete":
                        self.assertIn("204", operation["responses"])
                    if method == "post":
                        self.assertIn("201", operation["responses"])
                elif method == "get":
                    self.assertNotIn("security", operation, f"Public GET unexpectedly secured: {path}")

    def test_cors_origins_are_explicit_and_middleware_is_scoped(self):
        cors = next(middleware for middleware in app.user_middleware if middleware.cls.__name__ == "CORSMiddleware")
        self.assertEqual(cors.kwargs["allow_origins"], settings.cors_allowed_origins)
        self.assertEqual(cors.kwargs["allow_methods"], ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
        self.assertEqual(cors.kwargs["allow_headers"], ["Authorization", "Content-Type"])
        self.assertTrue(cors.kwargs["allow_credentials"])
        configured = Settings(frontend_url="http://localhost:3000,https://preview.example.test/")
        self.assertEqual(configured.cors_allowed_origins, ["http://localhost:3000", "https://preview.example.test"])
        with self.assertRaises(ValueError):
            Settings(frontend_url="*").cors_allowed_origins

    def test_repository_security_configuration_and_media_storage_shape(self):
        root = Path(__file__).resolve().parents[1]
        gitignore = (root / ".gitignore").read_text(encoding="utf-8").splitlines()
        self.assertIn(".env", gitignore)
        sample = dict(
            line.split("=", 1)
            for line in (root / ".env.example").read_text(encoding="utf-8").splitlines()
            if line and not line.startswith("#") and "=" in line
        )
        self.assertEqual(sample["FRONTEND_URL"], "http://localhost:3000")
        self.assertEqual(sample["MYSQL_PASSWORD"], "")
        for name in ("JWT_SECRET_KEY", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"):
            self.assertTrue(sample[name].startswith("<") and sample[name].endswith(">"))
        readme = (root / "README.md").read_text(encoding="utf-8")
        for line in readme.splitlines():
            if line.startswith(("MYSQL_PASSWORD=", "JWT_SECRET_KEY=", "CLOUDINARY_API_KEY=", "CLOUDINARY_API_SECRET=")):
                value = line.split("=", 1)[1]
                self.assertTrue(value.startswith("<") and value.endswith(">"))
        self.assertNotIn("password_hash", app.openapi()["components"]["schemas"])
        self.assertFalse(any(column.type.__class__.__name__ == "LargeBinary" for column in Media.__table__.columns))

    def test_authentication_missing_malformed_expired_and_valid_tokens(self):
        db = FakeDB(records={(User, 7): User(id=7, username="test-admin", password_hash="unused")})
        with self.assertRaises(HTTPException) as missing:
            get_current_admin(None, db)
        self.assertEqual(missing.exception.status_code, 401)
        for token in ("not-a-jwt", jwt.encode({"sub": "7", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, settings.jwt_secret_key.get_secret_value(), algorithm="HS256")):
            with self.assertRaises(HTTPException) as rejected:
                get_current_admin(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token), db)
            self.assertEqual(rejected.exception.status_code, 401)
        token = create_access_token("7")
        self.assertEqual(get_current_admin(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token), db).id, 7)

    def test_login_valid_and_invalid_credentials_with_fake_database(self):
        from app.routes.auth import login
        from app.schemas.auth import LoginRequest
        user = User(id=7, username="test-admin", password_hash=hash_password("test-only-password"))
        token = login(LoginRequest(username="test-admin", password="test-only-password"), FakeDB(scalar_results=[user]))
        self.assertTrue(token.access_token)
        with self.assertRaises(HTTPException) as invalid:
            login(LoginRequest(username="test-admin", password="wrong-test-password"), FakeDB(scalar_results=[user]))
        self.assertEqual(invalid.exception.status_code, 401)

    def test_account_settings_routes_require_authentication(self):
        paths = app.openapi()["paths"]
        for path in ("/api/auth/username", "/api/auth/password"):
            self.assertIn("patch", paths[path])
            self.assertIn("security", paths[path]["patch"])

    def test_username_change_checks_password_duplicate_and_persists(self):
        admin = User(id=7, username="old-name", password_hash=hash_password("test-only-current-password"))
        with self.assertRaises(HTTPException) as wrong_password:
            auth.change_username(
                UsernameChangeRequest(current_password="wrong", new_username="new-name", confirm_new_username="new-name"),
                FakeDB(), admin,
            )
        self.assertEqual(wrong_password.exception.status_code, 400)

        duplicate_db = FakeDB(scalar_results=[8])
        with self.assertRaises(HTTPException) as duplicate:
            auth.change_username(
                UsernameChangeRequest(current_password="test-only-current-password", new_username="taken", confirm_new_username="taken"),
                duplicate_db, admin,
            )
        self.assertEqual(duplicate.exception.status_code, 409)

        db = FakeDB(scalar_results=[None])
        response = auth.change_username(
            UsernameChangeRequest(current_password="test-only-current-password", new_username="new-name", confirm_new_username="new-name"),
            db, admin,
        )
        self.assertTrue(response.updated)
        self.assertEqual(admin.username, "new-name")
        self.assertEqual(db.commits, 1)
        self.assertTrue(auth.login(auth.LoginRequest(username="new-name", password="test-only-current-password"), FakeDB(scalar_results=[admin])).access_token)

        failed_db = FakeDB(fail_commit=True)
        with self.assertRaises(HTTPException) as database_error:
            auth.change_username(
                UsernameChangeRequest(current_password="test-only-current-password", new_username="other-name", confirm_new_username="other-name"),
                failed_db, admin,
            )
        self.assertEqual(database_error.exception.status_code, 503)
        self.assertEqual(failed_db.rollbacks, 1)

        with self.assertRaises(ValidationError):
            UsernameChangeRequest(current_password="x", new_username="one", confirm_new_username="two")
        with self.assertRaises(ValidationError):
            UsernameChangeRequest(current_password="x", new_username="   ", confirm_new_username="   ")

    def test_password_change_hash_policy_confirmation_and_old_password_rejection(self):
        admin = User(id=7, username="test-admin", password_hash=hash_password("test-only-current-password"))
        with self.assertRaises(ValidationError):
            PasswordChangeRequest(current_password="x", new_password="short", confirm_new_password="short")
        with self.assertRaises(ValidationError):
            PasswordChangeRequest(current_password="x", new_password="long-enough-password", confirm_new_password="different-password")
        with self.assertRaises(ValidationError):
            PasswordChangeRequest(current_password="x", new_password="é" * 600, confirm_new_password="é" * 600)

        with self.assertRaises(HTTPException) as incorrect_current:
            auth.change_password(
                PasswordChangeRequest(current_password="wrong", new_password="test-only-new-password", confirm_new_password="test-only-new-password"),
                FakeDB(), admin,
            )
        self.assertEqual(incorrect_current.exception.status_code, 400)

        previous_hash = admin.password_hash
        db = FakeDB()
        response = auth.change_password(
            PasswordChangeRequest(current_password="test-only-current-password", new_password="test-only-new-password", confirm_new_password="test-only-new-password"),
            db, admin,
        )
        self.assertTrue(response.updated)
        self.assertNotEqual(admin.password_hash, previous_hash)
        self.assertTrue(verify_password("test-only-new-password", admin.password_hash))
        self.assertFalse(verify_password("test-only-current-password", admin.password_hash))
        self.assertEqual(db.commits, 1)

        failed_db = FakeDB(fail_commit=True)
        with self.assertRaises(HTTPException) as database_error:
            auth.change_password(
                PasswordChangeRequest(current_password="test-only-current-password", new_password="another-test-password", confirm_new_password="another-test-password"),
                failed_db, User(id=9, username="db-fail", password_hash=hash_password("test-only-current-password")),
            )
        self.assertEqual(database_error.exception.status_code, 503)
        self.assertEqual(failed_db.rollbacks, 1)

        with self.assertRaises(HTTPException) as old_password_login:
            auth.login(auth.LoginRequest(username="test-admin", password="test-only-current-password"), FakeDB(scalar_results=[admin]))
        self.assertEqual(old_password_login.exception.status_code, 401)
        self.assertTrue(auth.login(auth.LoginRequest(username="test-admin", password="test-only-new-password"), FakeDB(scalar_results=[admin])).access_token)

    def test_project_create_duplicate_partial_update_and_missing(self):
        db = FakeDB()
        created = projects.create_project(ProjectCreate(title="T", slug="t"), db, User(id=1))
        self.assertEqual(created.slug, "t")
        self.assertEqual(projects.get_project_by_slug("t", FakeDB(scalar_results=[created])).slug, "t")
        self.assertEqual(projects.list_featured_projects(FakeDB(list_results=[[created]])), [created])
        duplicate_db = FakeDB(scalar_results=[3])
        with self.assertRaises(HTTPException) as duplicate:
            projects.create_project(ProjectCreate(title="T", slug="t"), duplicate_db, User(id=1))
        self.assertEqual(duplicate.exception.status_code, 409)
        stored = Project(id=3, title="Old", slug="old", featured=False, display_order=4)
        updated = projects.update_project(3, ProjectUpdate(title="New"), FakeDB(records={(Project, 3): stored}), User(id=1))
        self.assertEqual((updated.title, updated.slug), ("New", "old"))
        with self.assertRaises(HTTPException) as missing:
            projects.get_project_by_slug("absent", FakeDB())
        self.assertEqual(missing.exception.status_code, 404)
        self.assertEqual(projects.delete_project(3, FakeDB(records={(Project, 3): stored}), User(id=1)).status_code, 204)

    def test_public_listing_and_featured_routes_use_fake_sessions(self):
        project = Project(id=1, title="T", slug="t", featured=True, display_order=0)
        project_db = FakeDB(list_results=[[project]])
        self.assertEqual(projects.list_projects(project_db), [project])
        self.assertIn("ORDER BY projects.display_order, projects.id", project_db.statements[0])
        self.assertEqual(experience.list_featured_experiences(FakeDB(list_results=[["featured"]])), ["featured"])
        self.assertEqual(certificates.list_featured_certificates(FakeDB(list_results=[["featured"]])), ["featured"])
        self.assertEqual(achievements.list_featured_achievements(FakeDB(list_results=[["featured"]])), ["featured"])
        self.assertEqual(social_links.list_social_links(FakeDB(list_results=[["link"]])), ["link"])

    def test_experience_date_rules_and_current_experience(self):
        with self.assertRaises(ValidationError):
            ExperienceCreate(company="A", role="B", start_date=date(2024, 1, 1), end_date=date(2023, 1, 1))
        current = ExperienceCreate(company="A", role="B", start_date=date(2024, 1, 1), currently_working=True)
        self.assertIsNone(current.end_date)
        with self.assertRaises(ValidationError):
            ExperienceCreate(company="A", role="B", start_date=date(2024, 1, 1), currently_working=True, end_date=date(2025, 1, 1))

    def test_experience_and_certificate_route_create_update_delete(self):
        admin = User(id=1)
        exp_payload = ExperienceCreate(company="A", role="B", start_date=date(2023, 1, 1), end_date=date(2024, 1, 1))
        exp = experience.create_experience(exp_payload, FakeDB(), admin)
        self.assertEqual(exp.company, "A")
        stored_exp = Experience(id=2, company="A", role="B", start_date=date(2023, 1, 1), end_date=date(2024, 1, 1), currently_working=False, featured=False, display_order=0)
        changed_exp = experience.update_experience(2, experience.ExperienceUpdate(company="Changed"), FakeDB(records={(Experience, 2): stored_exp}), admin)
        self.assertEqual(changed_exp.company, "Changed")
        exp_delete_db = FakeDB(records={(Experience, 2): stored_exp})
        self.assertEqual(experience.delete_experience(2, exp_delete_db, admin).status_code, 204)
        self.assertEqual(exp_delete_db.deleted, [stored_exp])

        cert = certificates.create_certificate(CertificateCreate(title="Credential"), FakeDB(), admin)
        self.assertEqual(cert.title, "Credential")
        stored_cert = Certificate(id=4, title="Old", featured=False, display_order=0)
        changed_cert = certificates.update_certificate(4, certificates.CertificateUpdate(title="New"), FakeDB(records={(Certificate, 4): stored_cert}), admin)
        self.assertEqual(changed_cert.title, "New")
        self.assertEqual(certificates.delete_certificate(4, FakeDB(records={(Certificate, 4): stored_cert}), admin).status_code, 204)

    def test_certificate_schema_url_and_date_validation(self):
        value = CertificateCreate(title="Cert", credential_url="https://example.test/cert", issue_date=date(2024, 1, 1))
        self.assertEqual(value.issue_date, date(2024, 1, 1))
        with self.assertRaises(ValidationError):
            CertificateCreate(title="Cert", credential_url="not-a-url")

    def test_skills_category_relation_duplicate_and_order_listing(self):
        category = SkillCategory(id=1, name="Backend", display_order=0)
        created_category = skills.create_skill_category(SkillCategoryCreate(name="Backend"), FakeDB(), User(id=1))
        self.assertEqual(created_category.name, "Backend")
        skill = skills.create_skill(SkillCreate(name="Python", category_id=1), FakeDB(records={(SkillCategory, 1): category}), User(id=1))
        self.assertEqual(skill.category_id, 1)
        with self.assertRaises(HTTPException) as no_category:
            skills.create_skill(SkillCreate(name="Python", category_id=2), FakeDB(), User(id=1))
        self.assertEqual(no_category.exception.status_code, 404)
        listing = skills.list_skills(FakeDB(list_results=[[skill]]))
        self.assertEqual(listing, [skill])
        with self.assertRaises(HTTPException) as duplicate_category:
            skills.create_skill_category(SkillCategoryCreate(name="Backend"), FakeDB(scalar_results=[1]), User(id=1))
        self.assertEqual(duplicate_category.exception.status_code, 409)
        with self.assertRaises(HTTPException) as duplicate_skill:
            skills.create_skill(SkillCreate(name="Python", category_id=1), FakeDB(records={(SkillCategory, 1): category}, scalar_results=[1]), User(id=1))
        self.assertEqual(duplicate_skill.exception.status_code, 409)

    def test_achievement_create_featured_and_partial_update(self):
        created = achievements.create_achievement(AchievementCreate(title="Award", featured=True), FakeDB(), User(id=1))
        self.assertTrue(created.featured)
        stored = Achievement(id=5, title="Old", featured=True, display_order=2)
        updated = achievements.update_achievement(5, achievements.AchievementUpdate(short_description="new"), FakeDB(records={(Achievement, 5): stored}), User(id=1))
        self.assertEqual((updated.title, updated.short_description), ("Old", "new"))
        self.assertEqual(achievements.delete_achievement(5, FakeDB(records={(Achievement, 5): stored}), User(id=1)).status_code, 204)

    def test_social_link_create_and_url_validation(self):
        value = SocialLinkCreate(platform="GitHub", url="https://example.test/user")
        created = social_links.create_social_link(value, FakeDB(), User(id=1))
        self.assertEqual(created.platform, "GitHub")
        with self.assertRaises(ValidationError):
            SocialLinkCreate(platform="GitHub", url="invalid")
        stored = SocialLink(id=2, platform="GitHub", url="https://example.test/user", display_order=0)
        updated = social_links.update_social_link(2, social_links.SocialLinkUpdate(platform="Code host"), FakeDB(records={(SocialLink, 2): stored}), User(id=1))
        self.assertEqual((updated.platform, updated.url), ("Code host", "https://example.test/user"))
        self.assertEqual(social_links.delete_social_link(2, FakeDB(records={(SocialLink, 2): stored}), User(id=1)).status_code, 204)

    def test_profile_singleton_read_update_and_missing_profile(self):
        with self.assertRaises(HTTPException) as absent:
            profile.get_profile(FakeDB())
        self.assertEqual(absent.exception.status_code, 404)
        stored = Profile(id=1, name="Owner", headline="Old")
        updated = profile.update_profile(ProfileUpdate(headline="New"), FakeDB(scalar_results=[stored]), User(id=1))
        self.assertEqual((updated.name, updated.headline), ("Owner", "New"))
        self.assertNotIn("post", app.openapi()["paths"]["/api/admin/profile"])


class MediaUploadTests(unittest.TestCase):
    class File:
        def __init__(self, name="photo.png", mime="image/png", body=b"\x89PNG\r\n\x1a\ncontent"):
            self.filename, self.content_type, self.body = name, mime, body
            self.file = BytesIO(body)

    def test_upload_type_signature_size_provider_and_database_paths(self):
        db = FakeDB()
        with patch.object(media, "_upload_to_cloudinary", return_value={"secure_url": "https://cdn.example.test/photo.png", "public_id": "p/photo"}) as upload:
            image = media.upload_media(self.File(), "alt", db, User(id=1))
            self.assertEqual(image.file_type, "image/png")
            upload.assert_called_once_with(self.File().body, "image")

        image_cases = (
            ("photo.jpg", "image/jpeg", b"\xff\xd8\xffcontent"),
            ("photo.jpeg", "image/jpeg", b"\xff\xd8\xffcontent"),
            ("photo.png", "image/png", b"\x89PNG\r\n\x1a\ncontent"),
            ("photo.webp", "image/webp", b"RIFFxxxxWEBPcontent"),
        )
        for filename, mime_type, signature in image_cases:
            with self.subTest(filename=filename), patch.object(
                media,
                "_upload_to_cloudinary",
                return_value={"secure_url": f"https://cdn.example.test/{filename}", "public_id": f"p/{filename}"},
            ) as upload:
                media.upload_media(self.File(filename, mime_type, signature), None, FakeDB(), User(id=1))
                upload.assert_called_once_with(signature, "image")

        pdf = self.File("document.pdf", "application/pdf", b"%PDF-1.7 content")
        with patch.object(media, "_upload_to_cloudinary", return_value={"secure_url": "https://cdn.example.test/file.pdf", "public_id": "p/file"}) as upload:
            result = media.upload_media(pdf, None, FakeDB(), User(id=1))
            self.assertEqual(result.file_type, "application/pdf")
            upload.assert_called_once_with(pdf.body, "image")

        for bad_file in (self.File("bad.exe", "application/octet-stream", b"MZ"), self.File("x.png", "text/plain"), self.File(body=b"invalid")):
            with patch.object(media, "_upload_to_cloudinary") as upload:
                with self.assertRaises(HTTPException):
                    media.upload_media(bad_file, None, FakeDB(), User(id=1))
                upload.assert_not_called()

        with patch.object(settings, "media_max_upload_size_mb", 1), patch.object(media, "_upload_to_cloudinary") as upload:
            too_big = self.File(body=b"\x89PNG\r\n\x1a\n" + b"x" * (1024 * 1024))
            with self.assertRaises(HTTPException) as oversized:
                media.upload_media(too_big, None, FakeDB(), User(id=1))
            self.assertEqual(oversized.exception.status_code, 413)
            upload.assert_not_called()

        with patch.object(media, "_upload_to_cloudinary", side_effect=OSError("mock provider failure")):
            with self.assertRaises(HTTPException) as provider_error:
                media.upload_media(self.File(), None, FakeDB(), User(id=1))
            self.assertEqual(provider_error.exception.status_code, 502)

        cleanup = []
        with patch.object(media, "_upload_to_cloudinary", return_value={"secure_url": "https://cdn.example.test/photo.png", "public_id": "p/photo"}), patch.object(media, "_delete_from_cloudinary", side_effect=lambda pid, typ: cleanup.append((pid, typ))):
            with self.assertRaises(HTTPException) as db_error:
                media.upload_media(self.File(), None, FakeDB(fail_commit=True), User(id=1))
            self.assertEqual(db_error.exception.status_code, 503)
        self.assertEqual(cleanup, [("p/photo", "image")])

        pdf_cleanup = []
        with patch.object(media, "_upload_to_cloudinary", return_value={"secure_url": "https://cdn.example.test/file.pdf", "public_id": "p/file"}), patch.object(media, "_delete_from_cloudinary", side_effect=lambda pid, typ: pdf_cleanup.append((pid, typ))):
            with self.assertRaises(HTTPException) as pdf_db_error:
                media.upload_media(self.File("document.pdf", "application/pdf", b"%PDF-1.7 content"), None, FakeDB(fail_commit=True), User(id=1))
            self.assertEqual(pdf_db_error.exception.status_code, 503)
        self.assertEqual(pdf_cleanup, [("p/file", "image")])

    def test_upload_diagnostics_log_stage_and_status_without_exception_message(self):
        secret_marker = "provider-error-secret-marker"
        with patch.object(media, "_upload_to_cloudinary", side_effect=OSError(secret_marker)):
            with self.assertLogs(media.logger, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as failed:
                    media.upload_media(self.File(), None, FakeDB(), User(id=1))

        self.assertEqual(failed.exception.status_code, 502)
        log_output = "\n".join(captured.output)
        self.assertIn("stage=cloudinary_upload", log_output)
        self.assertIn("status=502", log_output)
        self.assertIn("error_type=OSError", log_output)
        self.assertNotIn(secret_marker, log_output)

        with patch.object(
            media,
            "_upload_to_cloudinary",
            return_value={"secure_url": "https://cdn.example.test/photo.png", "public_id": "p/photo"},
        ), patch.object(media, "_delete_from_cloudinary"):
            with self.assertLogs(media.logger, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as database_failed:
                    media.upload_media(self.File(), None, FakeDB(fail_commit=True), User(id=1))

        self.assertEqual(database_failed.exception.status_code, 503)
        database_log = "\n".join(captured.output)
        self.assertIn("stage=database_persistence", database_log)
        self.assertIn("status=503", database_log)
        self.assertNotIn("mock database failure", database_log)

    def test_media_database_crud_and_cloudinary_deletion_policy(self):
        stored = Media(id=8, file_url="https://res.cloudinary.com/demo/raw/upload/v1/portfolio/file.pdf", public_id="portfolio/file.pdf", file_type="application/pdf", alt_text="old")
        update_db = FakeDB(records={(Media, 8): stored})
        updated = media.update_media(8, MediaUpdate(alt_text="new"), update_db, User(id=1))
        self.assertEqual((updated.file_url, updated.alt_text), (stored.file_url, "new"))
        created = media.create_media(MediaCreate(file_url="https://example.test/file.pdf", file_type="application/pdf"), FakeDB(), User(id=1))
        self.assertEqual(created.file_type, "application/pdf")
        self.assertEqual(media.list_media(FakeDB(list_results=[[stored]]), User(id=1)), [stored])
        self.assertEqual(media.get_media(8, FakeDB(records={(Media, 8): stored})), stored)
        with self.assertRaises(ValidationError):
            MediaCreate(file_url="not-a-url", file_type="application/pdf")
        with patch.object(media, "_delete_from_cloudinary", return_value="ok") as destroy:
            response = media.delete_media(8, FakeDB(records={(Media, 8): stored}), User(id=1))
            self.assertEqual(response.status_code, 204)
            destroy.assert_called_once_with("portfolio/file.pdf", "raw")
        stored_image_pdf = Media(id=10, file_url="https://res.cloudinary.com/demo/image/upload/v1/portfolio/new-file.pdf", public_id="portfolio/new-file", file_type="application/pdf", alt_text=None)
        with patch.object(media, "_delete_from_cloudinary", return_value="ok") as destroy:
            response = media.delete_media(10, FakeDB(records={(Media, 10): stored_image_pdf}), User(id=1))
            self.assertEqual(response.status_code, 204)
            destroy.assert_called_once_with("portfolio/new-file", "image")
        with patch.object(media, "_delete_from_cloudinary", return_value="not found"):
            self.assertEqual(media.delete_media(8, FakeDB(records={(Media, 8): stored}), User(id=1)).status_code, 204)
        with patch.object(media, "_delete_from_cloudinary", side_effect=OSError("provider unavailable")):
            db = FakeDB(records={(Media, 8): stored})
            with self.assertRaises(HTTPException) as failed:
                media.delete_media(8, db, User(id=1))
            self.assertEqual(failed.exception.status_code, 502)
            self.assertFalse(db.deleted)
        without_external_id = Media(id=9, file_url="https://example.test/file.pdf", public_id=None, file_type="application/pdf", alt_text=None)
        with patch.object(media, "_delete_from_cloudinary") as destroy:
            self.assertEqual(media.delete_media(9, FakeDB(records={(Media, 9): without_external_id}), User(id=1)).status_code, 204)
            destroy.assert_not_called()


if __name__ == "__main__":
    unittest.main()
