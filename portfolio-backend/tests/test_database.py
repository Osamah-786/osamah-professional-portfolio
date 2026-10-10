import os
import ssl
import unittest
from unittest.mock import patch

import pymysql
from app.config import Settings
from app.database import _build_engine_options


class DatabaseEngineConfigurationTests(unittest.TestCase):
    def test_default_mode_preserves_local_mysql_driver_behavior(self):
        settings = Settings(_env_file=None)
        options = _build_engine_options(settings.mysql_tls_mode)

        self.assertEqual(settings.mysql_tls_mode, "preferred")
        self.assertTrue(options["pool_pre_ping"])
        self.assertTrue(options["hide_parameters"])
        self.assertNotIn("connect_args", options)
        self.assertNotIn("pool_recycle", options)

    def test_verified_tls_mode_uses_system_roots_and_hostname_verification(self):
        settings = Settings(_env_file=None, mysql_tls_mode="verify_identity")
        options = _build_engine_options(settings.mysql_tls_mode)

        connect_args = options["connect_args"]
        self.assertIsInstance(connect_args, dict)
        tls_context = connect_args["ssl"]
        self.assertIsInstance(tls_context, ssl.SSLContext)
        self.assertEqual(tls_context.verify_mode, ssl.CERT_REQUIRED)
        self.assertTrue(tls_context.check_hostname)
        self.assertEqual(options["pool_recycle"], 300)
        self.assertTrue(options["pool_pre_ping"])
        self.assertTrue(options["hide_parameters"])

        connection = pymysql.connections.Connection(
            host="database.example.test",
            user="test-user",
            ssl=tls_context,
            defer_connect=True,
        )
        try:
            self.assertIs(connection.ctx, tls_context)
        finally:
            connection.close()

    def test_tls_mode_is_loaded_from_environment(self):
        with patch.dict(os.environ, {"MYSQL_TLS_MODE": "verify_identity"}):
            settings = Settings(_env_file=None)

        self.assertEqual(settings.mysql_tls_mode, "verify_identity")


if __name__ == "__main__":
    unittest.main()
