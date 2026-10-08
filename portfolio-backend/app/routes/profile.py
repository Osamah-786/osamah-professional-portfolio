from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


def _current_profile(db: Session) -> Profile | None:
    statement = select(Profile).order_by(Profile.id).limit(1)
    return db.scalar(statement)


@router.get("/api/profile", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)) -> Profile:
    try:
        profile = _current_profile(db)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("/api/admin/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Profile:
    try:
        profile = _current_profile(db)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

        updates = payload.model_dump(exclude_unset=True)
        if "name" in updates and updates["name"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="name cannot be null",
            )
        for field in ("profile_image", "resume_url"):
            if field in updates and updates[field] is not None:
                updates[field] = str(updates[field])

        for field, value in updates.items():
            setattr(profile, field, value)
        db.commit()
        db.refresh(profile)
        return profile
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
