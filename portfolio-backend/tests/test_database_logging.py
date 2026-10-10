import unittest

from fastapi import HTTPException
from sqlalchemy.exc import OperationalError

from app.routes import profile, projects
from app.utils.database_logging import log_database_error


class MockDriverError(Exception):
    sqlstate = "hy000"


def _sensitive_database_error() -> OperationalError:
    original = MockDriverError(
        2026,
        "TLS error with password=must-not-appear "
        "mysql+pymysql://private-user:private-password@db.example/private-db",
    )
    return OperationalError(
        "SELECT * FROM private_table WHERE token = %(token)s",
        {"token": "private-query-value"},
        original,
        connection_invalidated=True,
    )


class FailingProfileSession:
    def scalar(self, _statement):
        raise _sensitive_database_error()


class FailingProjectsSession:
    def scalars(self, _statement):
        raise _sensitive_database_error()


class DatabaseLoggingTests(unittest.TestCase):
    def test_logs_diagnostics_without_exception_text_or_credentials(self):
        error = _sensitive_database_error()

        with self.assertLogs("app.utils.database_logging", level="ERROR") as captured:
            log_database_error("projects.list", error)

        output = "\n".join(captured.output)
        self.assertIn("operation=projects.list", output)
        self.assertIn("exception_types=OperationalError>MockDriverError", output)
        self.assertIn("driver_code=2026", output)
        self.assertIn("sqlstate=HY000", output)
        self.assertIn("connection_invalidated=True", output)
        for sensitive_value in (
            "must-not-appear",
            "private-user",
            "private-password",
            "private-db",
            "private-query-value",
        ):
            self.assertNotIn(sensitive_value, output)

    def test_public_profile_and_projects_errors_remain_generic_503(self):
        route_cases = (
            ("profile.get", lambda: profile.get_profile(FailingProfileSession())),
            ("projects.list", lambda: projects.list_projects(FailingProjectsSession())),
        )

        for operation, call in route_cases:
            with self.subTest(operation=operation):
                with self.assertLogs("app.utils.database_logging", level="ERROR") as captured:
                    with self.assertRaises(HTTPException) as response:
                        call()

                self.assertEqual(response.exception.status_code, 503)
                self.assertEqual(response.exception.detail, "Database unavailable")
                output = "\n".join(captured.output)
                self.assertIn(f"operation={operation}", output)
                self.assertNotIn("private-password", output)
                self.assertNotIn("private-query-value", output)


if __name__ == "__main__":
    unittest.main()
