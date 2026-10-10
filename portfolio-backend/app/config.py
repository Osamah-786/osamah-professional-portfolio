from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Portfolio Backend"
    app_version: str = "0.1.0"
    debug: bool = True
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "portfolio_db"
    mysql_tls_mode: Literal["preferred", "verify_identity"] = "preferred"
    jwt_secret_key: SecretStr = SecretStr("")
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    access_token_expire_minutes: int = Field(default=30, gt=0, le=60)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: SecretStr = SecretStr("")
    cloudinary_api_secret: SecretStr = SecretStr("")
    media_max_upload_size_mb: int = Field(default=10, gt=0, le=100)
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_allowed_origins(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.frontend_url.split(",") if origin.strip()]
        if not origins or "*" in origins:
            raise ValueError("FRONTEND_URL must contain one or more explicit origins")
        return origins


settings = Settings()
