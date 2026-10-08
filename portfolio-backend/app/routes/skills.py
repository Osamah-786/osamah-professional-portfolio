from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.skill import Skill, SkillCategory
from app.models.user import User
from app.schemas.skill import (
    SkillCategoryCreate,
    SkillCategoryResponse,
    SkillCategoryUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
)
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


def _category_name_conflict() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skill category name already exists")


def _skill_name_conflict() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skill name already exists in this category")


@router.get("/api/skill-categories", response_model=list[SkillCategoryResponse])
def list_skill_categories(db: Session = Depends(get_db)) -> list[SkillCategory]:
    try:
        return list(db.scalars(select(SkillCategory).order_by(SkillCategory.display_order, SkillCategory.id)).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/skill-categories/{id}", response_model=SkillCategoryResponse)
def get_skill_category(id: int, db: Session = Depends(get_db)) -> SkillCategory:
    try:
        category = db.get(SkillCategory, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")
    return category


@router.get("/api/skills", response_model=list[SkillResponse])
def list_skills(db: Session = Depends(get_db)) -> list[Skill]:
    try:
        return list(db.scalars(select(Skill).order_by(Skill.display_order, Skill.id)).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/skills/{id}", response_model=SkillResponse)
def get_skill(id: int, db: Session = Depends(get_db)) -> Skill:
    try:
        skill = db.get(Skill, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


@router.get("/api/skill-categories/{category_id}/skills", response_model=list[SkillResponse])
def list_category_skills(category_id: int, db: Session = Depends(get_db)) -> list[Skill]:
    try:
        category = db.get(SkillCategory, category_id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")
        statement = (
            select(Skill)
            .where(Skill.category_id == category_id)
            .order_by(Skill.display_order, Skill.id)
        )
        return list(db.scalars(statement).all())
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.post(
    "/api/admin/skill-categories",
    response_model=SkillCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_skill_category(
    payload: SkillCategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> SkillCategory:
    try:
        existing = db.scalar(select(SkillCategory.id).where(SkillCategory.name == payload.name))
        if existing is not None:
            raise _category_name_conflict()
        category = SkillCategory(**payload.model_dump())
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise _category_name_conflict() from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/skill-categories/{id}", response_model=SkillCategoryResponse)
def update_skill_category(
    id: int,
    payload: SkillCategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> SkillCategory:
    try:
        category = db.get(SkillCategory, id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")

        updates = payload.model_dump(exclude_unset=True)
        for field in ("name", "display_order"):
            if field in updates and updates[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} cannot be null",
                )

        new_name = updates.get("name")
        if new_name is not None and new_name != category.name:
            existing = db.scalar(
                select(SkillCategory.id).where(SkillCategory.name == new_name, SkillCategory.id != id)
            )
            if existing is not None:
                raise _category_name_conflict()

        for field, value in updates.items():
            setattr(category, field, value)
        db.commit()
        db.refresh(category)
        return category
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise _category_name_conflict() from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/skill-categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill_category(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        category = db.get(SkillCategory, id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")

        has_skills = db.scalar(select(Skill.id).where(Skill.category_id == id))
        if has_skills is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete a category that contains skills",
            )

        db.delete(category)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a category that contains skills",
        ) from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.post("/api/admin/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    payload: SkillCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Skill:
    try:
        category = db.get(SkillCategory, payload.category_id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")

        existing = db.scalar(
            select(Skill.id).where(Skill.category_id == payload.category_id, Skill.name == payload.name)
        )
        if existing is not None:
            raise _skill_name_conflict()

        data = payload.model_dump()
        if data["icon"] is not None:
            data["icon"] = str(data["icon"])
        skill = Skill(**data)
        db.add(skill)
        db.commit()
        db.refresh(skill)
        return skill
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise _skill_name_conflict() from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/skills/{id}", response_model=SkillResponse)
def update_skill(
    id: int,
    payload: SkillUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Skill:
    try:
        skill = db.get(Skill, id)
        if skill is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

        updates = payload.model_dump(exclude_unset=True)
        for field in ("name", "category_id", "display_order"):
            if field in updates and updates[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} cannot be null",
                )

        new_category_id = updates.get("category_id", skill.category_id)
        if "category_id" in updates and db.get(SkillCategory, new_category_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill category not found")

        new_name = updates.get("name", skill.name)
        if new_name != skill.name or new_category_id != skill.category_id:
            existing = db.scalar(
                select(Skill.id).where(
                    Skill.category_id == new_category_id,
                    Skill.name == new_name,
                    Skill.id != id,
                )
            )
            if existing is not None:
                raise _skill_name_conflict()

        if "icon" in updates and updates["icon"] is not None:
            updates["icon"] = str(updates["icon"])
        for field, value in updates.items():
            setattr(skill, field, value)
        db.commit()
        db.refresh(skill)
        return skill
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise _skill_name_conflict() from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/skills/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        skill = db.get(Skill, id)
        if skill is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        db.delete(skill)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
