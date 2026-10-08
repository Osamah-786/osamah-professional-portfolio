import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from unittest.mock import patch

from sqlalchemy.exc import SQLAlchemyError

from app.models.profile import Profile
from app.utils import create_profile


class ProfileStore:
    def __init__(self, profiles=None):
        self.profiles = list(profiles or [])
        self.commits = 0
        self.rollbacks = 0
        self.added = []
        self.fail_commit = False


class ProfileSession:
    def __init__(self, store: ProfileStore):
        self.store = store
        self.pending = []

    def __enter__(self):
        return self

    def __exit__(self, _exception_type, _exception, _traceback):
        return False

    def scalar(self, _statement):
        return self.store.profiles[0].id if self.store.profiles else None

    def add(self, profile):
        self.pending.append(profile)
        self.store.added.append(profile)

    def commit(self):
        if self.store.fail_commit:
            raise SQLAlchemyError("mock failure containing a private connection value")
        for profile in self.pending:
            profile.id = len(self.store.profiles) + 1
            self.store.profiles.append(profile)
        self.pending.clear()
        self.store.commits += 1

    def rollback(self):
        self.pending.clear()
        self.store.rollbacks += 1


class CreateProfileTests(unittest.TestCase):
    def test_existing_profile_is_untouched(self):
        existing = Profile(id=1, name="Osamah", headline="Existing headline")
        store = ProfileStore([existing])
        output = StringIO()
        with patch.object(create_profile, "SessionLocal", side_effect=lambda: ProfileSession(store)):
            with redirect_stdout(output):
                result = create_profile.main()

        self.assertEqual(result, 0)
        self.assertIn("already exists", output.getvalue())
        self.assertEqual(store.profiles, [existing])
        self.assertEqual((existing.name, existing.headline), ("Osamah", "Existing headline"))
        self.assertEqual(store.added, [])
        self.assertEqual(store.commits, 0)

    def test_missing_profile_creates_one_empty_row_and_is_idempotent(self):
        store = ProfileStore()
        first_output = StringIO()
        second_output = StringIO()
        with patch.object(create_profile, "SessionLocal", side_effect=lambda: ProfileSession(store)):
            with redirect_stdout(first_output):
                first_result = create_profile.main()
            with redirect_stdout(second_output):
                second_result = create_profile.main()

        self.assertEqual((first_result, second_result), (0, 0))
        self.assertIn("Created the initial empty profile", first_output.getvalue())
        self.assertIn("already exists", second_output.getvalue())
        self.assertEqual(len(store.profiles), 1)
        self.assertEqual(store.commits, 1)
        profile = store.profiles[0]
        self.assertEqual(profile.name, "")
        for field in (
            "headline",
            "short_bio",
            "full_bio",
            "profile_image",
            "location",
            "email",
            "resume_url",
        ):
            self.assertIsNone(getattr(profile, field))

    def test_database_failure_rolls_back_and_does_not_print_error_details(self):
        store = ProfileStore()
        store.fail_commit = True
        error_output = StringIO()
        with patch.object(create_profile, "SessionLocal", side_effect=lambda: ProfileSession(store)):
            with redirect_stderr(error_output):
                result = create_profile.main()

        self.assertEqual(result, 1)
        self.assertEqual(store.rollbacks, 1)
        self.assertIn("database operation did not complete", error_output.getvalue())
        self.assertNotIn("private connection value", error_output.getvalue())
        self.assertEqual(store.profiles, [])


if __name__ == "__main__":
    unittest.main()
