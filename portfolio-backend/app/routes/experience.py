from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experience import Experience
from app.models.user import User
from app.schemas.experience import ExperienceCreate, ExperienceResponse, ExperienceUpdate
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


def _validate_dates(start_date: date | None, end_date: date | None, currently_working: bool) -> None:
    if start_date is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="start_date is required")
    if currently_working and end_date is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be null for a current experience",
        )
    if not currently_working and end_date is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date is required when currently_working is false",
        )
    if end_date is not None and end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date cannot be before start_date",
        )


@router.get("/api/experience", response_model=list[ExperienceResponse])
def list_experiences(db: Session = Depends(get_db)) -> list[Experience]:
    try:
        return list(db.scalars(select(Experience).order_by(Experience.display_order, Experience.id)).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/experience/featured", response_model=list[ExperienceResponse])
def list_featured_experiences(db: Session = Depends(get_db)) -> list[Experience]:
    statement = (
        select(Experience)
        .where(Experience.featured.is_(True))
        .order_by(Experience.display_order, Experience.id)
    )
    try:
        return list(db.scalars(statement).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/experience/{id}", response_model=ExperienceResponse)
def get_experience(id: int, db: Session = Depends(get_db)) -> Experience:
    try:
        experience = db.get(Experience, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if experience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience


@router.post(
    "/api/admin/experience",
    response_model=ExperienceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_experience(
    payload: ExperienceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Experience:
    try:
        experience_data = payload.model_dump()
        if experience_data["company_logo"] is not None:
            experience_data["company_logo"] = str(experience_data["company_logo"])
        experience = Experience(**experience_data)
        db.add(experience)
        db.commit()
        db.refresh(experience)
        return experience
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/experience/{id}", response_model=ExperienceResponse)
def update_experience(
    id: int,
    payload: ExperienceUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Experience:
    try:
        experience = db.get(Experience, id)
        if experience is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")

        updates = payload.model_dump(exclude_unset=True)
        for field in ("company", "role", "start_date", "currently_working", "featured", "display_order"):
            if field in updates and updates[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"{field} cannot be null",
                )
        if "company_logo" in updates and updates["company_logo"] is not None:
            updates["company_logo"] = str(updates["company_logo"])

        currently_working = updates.get("currently_working", experience.currently_working)
        start_date = updates.get("start_date", experience.start_date)
        end_date = updates.get("end_date", experience.end_date)
        if currently_working and "end_date" not in updates:
            end_date = None
            updates["end_date"] = None
        _validate_dates(start_date, end_date, currently_working)

        for field, value in updates.items():
            setattr(experience, field, value)
        db.commit()
        db.refresh(experience)
        return experience
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/experience/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        experience = db.get(Experience, id)
        if experience is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
        db.delete(experience)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
