from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.achievement import Achievement
from app.models.user import User
from app.schemas.achievement import AchievementCreate, AchievementResponse, AchievementUpdate
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


@router.get("/api/achievements", response_model=list[AchievementResponse])
def list_achievements(db: Session = Depends(get_db)) -> list[Achievement]:
    try:
        return list(db.scalars(select(Achievement).order_by(Achievement.display_order, Achievement.id)).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/achievements/featured", response_model=list[AchievementResponse])
def list_featured_achievements(db: Session = Depends(get_db)) -> list[Achievement]:
    statement = (
        select(Achievement)
        .where(Achievement.featured.is_(True))
        .order_by(Achievement.display_order, Achievement.id)
    )
    try:
        return list(db.scalars(statement).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/achievements/{id}", response_model=AchievementResponse)
def get_achievement(id: int, db: Session = Depends(get_db)) -> Achievement:
    try:
        achievement = db.get(Achievement, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if achievement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")
    return achievement


@router.post(
    "/api/admin/achievements",
    response_model=AchievementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_achievement(
    payload: AchievementCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Achievement:
    try:
        data = payload.model_dump()
        for field in ("image", "link"):
            if data[field] is not None:
                data[field] = str(data[field])
        achievement = Achievement(**data)
        db.add(achievement)
        db.commit()
        db.refresh(achievement)
        return achievement
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/achievements/{id}", response_model=AchievementResponse)
def update_achievement(
    id: int,
    payload: AchievementUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Achievement:
    try:
        achievement = db.get(Achievement, id)
        if achievement is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")

        updates = payload.model_dump(exclude_unset=True)
        for field in ("title", "featured", "display_order"):
            if field in updates and updates[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} cannot be null",
                )
        for field in ("image", "link"):
            if field in updates and updates[field] is not None:
                updates[field] = str(updates[field])

        for field, value in updates.items():
            setattr(achievement, field, value)
        db.commit()
        db.refresh(achievement)
        return achievement
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/achievements/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_achievement(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        achievement = db.get(Achievement, id)
        if achievement is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")
        db.delete(achievement)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
