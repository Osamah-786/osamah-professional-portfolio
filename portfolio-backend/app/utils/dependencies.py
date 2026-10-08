from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)
_unauthorized = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication required",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if credentials is None:
        raise _unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        ) from None
    except jwt.InvalidTokenError:
        raise _unauthorized

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdecimal():
        raise _unauthorized

    user = db.get(User, int(subject))
    if user is None:
        raise _unauthorized
    return user
