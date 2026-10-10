from collections.abc import Generator
import ssl
from typing import Literal

from sqlalchemy import URL, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


MySQLTLSMode = Literal["preferred", "verify_identity"]


def _build_engine_options(tls_mode: MySQLTLSMode) -> dict[str, object]:
    options: dict[str, object] = {
        "pool_pre_ping": True,
        "hide_parameters": True,
    }

    if tls_mode == "verify_identity":
        tls_context = ssl.create_default_context()
        options["connect_args"] = {"ssl": tls_context}
        options["pool_recycle"] = 300

    return options


database_url = URL.create(
    drivername="mysql+pymysql",
    username=settings.mysql_user,
    password=settings.mysql_password,
    host=settings.mysql_host,
    port=settings.mysql_port,
    database=settings.mysql_database,
    query={"charset": "utf8mb4"},
)

engine = create_engine(database_url, **_build_engine_options(settings.mysql_tls_mode))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_database_connection() -> None:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise RuntimeError(
            "MySQL connection failed. Check the .env settings, database availability, and that the database exists."
        ) from None
