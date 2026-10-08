import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter()
_password_hasher = PasswordHasher()
_dummy_password_hash = _password_hasher.hash(secrets.token_urlsafe(32))
_invalid_credentials = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid username or password",
    headers={"WWW-Authenticate": "Bearer"},
)


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.username == credentials.username))
    if user is None:
        try:
            _password_hasher.verify(_dummy_password_hash, credentials.password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            pass
        raise _invalid_credentials

    if not verify_password(credentials.password, user.password_hash):
        raise _invalid_credentials

    try:
        access_token = create_access_token(subject=str(user.id))
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        ) from None

    return TokenResponse(access_token=access_token)
