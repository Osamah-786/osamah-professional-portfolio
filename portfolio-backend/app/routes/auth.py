import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AccountUpdateResponse,
    LoginRequest,
    PasswordChangeRequest,
    TokenResponse,
    UsernameChangeRequest,
)
from app.utils.dependencies import get_current_admin
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


@router.patch("/username", response_model=AccountUpdateResponse)
def change_username(
    update: UsernameChangeRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> AccountUpdateResponse:
    if not verify_password(update.current_password.get_secret_value(), current_admin.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    username = update.new_username
    try:
        duplicate_id = db.scalar(select(User.id).where(User.username == username))
        if duplicate_id is not None and duplicate_id != current_admin.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already in use")

        current_admin.username = username
        db.commit()
        db.refresh(current_admin)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already in use") from None
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to update account") from None

    return AccountUpdateResponse()


@router.patch("/password", response_model=AccountUpdateResponse)
def change_password(
    update: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> AccountUpdateResponse:
    if not verify_password(update.current_password.get_secret_value(), current_admin.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    try:
        current_admin.password_hash = hash_password(update.new_password.get_secret_value())
        db.commit()
        db.refresh(current_admin)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to update account") from None

    return AccountUpdateResponse()
