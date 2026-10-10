import logging
import re
import traceback
from pathlib import Path

from sqlalchemy.exc import DBAPIError, SQLAlchemyError


logger = logging.getLogger(__name__)
_SQLSTATE_PATTERN = re.compile(r"^[0-9A-Z]{5}$")


def _exception_types(error: BaseException) -> str:
    chain: list[str] = []
    pending: list[BaseException] = [error]
    seen: set[int] = set()

    while pending:
        current = pending.pop(0)
        if id(current) in seen:
            continue
        seen.add(id(current))
        chain.append(type(current).__name__)
        if current.__cause__ is not None:
            pending.append(current.__cause__)
        elif current.__context__ is not None:
            pending.append(current.__context__)

    if isinstance(error, DBAPIError) and error.orig is not error:
        if id(error.orig) not in seen:
            chain.append(type(error.orig).__name__)

    return ">".join(chain)


def _diagnostic_code(error: SQLAlchemyError) -> str:
    original = error.orig if isinstance(error, DBAPIError) else None
    args = getattr(original, "args", ())
    if args and isinstance(args[0], int):
        return str(args[0])
    return "none"


def _sqlstate(error: SQLAlchemyError) -> str:
    original = error.orig if isinstance(error, DBAPIError) else None
    value = getattr(original, "sqlstate", None)
    if isinstance(value, str) and _SQLSTATE_PATTERN.fullmatch(value.upper()):
        return value.upper()
    return "none"


def _traceback_locations(error: BaseException) -> str:
    frames = traceback.extract_tb(error.__traceback__)
    return ">".join(
        f"{Path(frame.filename).name}:{frame.name}:{frame.lineno}"
        for frame in frames
    ) or "unavailable"


def log_database_error(operation: str, error: SQLAlchemyError) -> None:
    """Log database diagnostics without exception text, SQL, parameters, or URLs."""
    connection_invalidated = (
        error.connection_invalidated if isinstance(error, DBAPIError) else False
    )
    logger.error(
        "Database operation failed | operation=%s | exception_types=%s | "
        "driver_code=%s | sqlstate=%s | connection_invalidated=%s | traceback=%s",
        operation,
        _exception_types(error),
        _diagnostic_code(error),
        _sqlstate(error),
        connection_invalidated,
        _traceback_locations(error),
    )
