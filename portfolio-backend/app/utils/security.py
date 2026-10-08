from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.config import settings

_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def _signing_key() -> str:
    secret = settings.jwt_secret_key.get_secret_value()
    minimum_length = {"HS256": 32, "HS384": 48, "HS512": 64}[settings.jwt_algorithm]
    if len(secret.encode("utf-8")) < minimum_length or "<" in secret or ">" in secret:
        raise RuntimeError("JWT secret is missing or too weak")
    return secret


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, _signing_key(), algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, object]:
    return jwt.decode(
        token,
        _signing_key(),
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub"]},
    )
