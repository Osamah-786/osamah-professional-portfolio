from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio_section import PortfolioSection
from app.models.user import User
from app.schemas.portfolio_section import (
    PublicSectionResponse,
    SectionCreate,
    SectionDuplicateRequest,
    SectionReorderRequest,
    SectionResponse,
    SectionUpdate,
)
from app.utils.database_logging import log_database_error
from app.utils.dependencies import get_current_admin

router = APIRouter()
BUILT_IN_KEYS = {
    "profile",
    "experience",
    "projects",
    "skills",
    "certificates",
    "achievements",
    "social_links",
    "contact",
}


def _database_unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail="Database unavailable")


def _slug_conflict(db: Session, slug: str, *, exclude_id: int | None = None) -> bool:
    statement = select(PortfolioSection.id).where(PortfolioSection.slug == slug)
    if exclude_id is not None:
        statement = statement.where(PortfolioSection.id != exclude_id)
    return db.scalar(statement) is not None


def _title_conflict(db: Session, title: str, *, exclude_id: int | None = None) -> bool:
    statement = select(PortfolioSection.id).where(PortfolioSection.title == title)
    if exclude_id is not None:
        statement = statement.where(PortfolioSection.id != exclude_id)
    return db.scalar(statement) is not None


def _validate_payload(payload: SectionCreate, *, section_type: str, key: str) -> SectionCreate:
    if section_type == "built_in":
        if key not in BUILT_IN_KEYS:
            raise HTTPException(status_code=400, detail="Unknown built-in section key")
        if payload.content_blocks or payload.custom_fields or payload.custom_field_values:
            raise HTTPException(status_code=400, detail="Built-in sections reference existing portfolio content")
    elif section_type != "custom":
        raise HTTPException(status_code=400, detail="Invalid section type")
    return payload


@router.get("/api/sections", response_model=list[PublicSectionResponse])
def list_public_sections(
    placement: Literal["home", "full"] = Query(default="home"),
    db: Session = Depends(get_db),
) -> list[PortfolioSection]:
    visibility = PortfolioSection.show_on_homepage if placement == "home" else PortfolioSection.show_on_full_page
    statement = (
        select(PortfolioSection)
        .where(
            PortfolioSection.enabled.is_(True),
            PortfolioSection.status == "published",
            visibility.is_(True),
        )
        .order_by(PortfolioSection.display_order, PortfolioSection.id)
    )
    try:
        return list(db.scalars(statement).all())
    except SQLAlchemyError as error:
        log_database_error("sections.public_list", error)
        raise _database_unavailable() from None


@router.get("/api/sections/{slug}", response_model=PublicSectionResponse)
def get_public_section(slug: str, db: Session = Depends(get_db)) -> PortfolioSection:
    statement = select(PortfolioSection).where(
        PortfolioSection.slug == slug,
        PortfolioSection.enabled.is_(True),
        PortfolioSection.status == "published",
        PortfolioSection.show_on_full_page.is_(True),
        PortfolioSection.read_more_enabled.is_(True),
    )
    try:
        section = db.scalar(statement)
    except SQLAlchemyError as error:
        log_database_error("sections.public_get", error)
        raise _database_unavailable() from None
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.get("/api/admin/sections", response_model=list[SectionResponse])
def list_admin_sections(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[PortfolioSection]:
    try:
        return list(
            db.scalars(select(PortfolioSection).order_by(PortfolioSection.display_order, PortfolioSection.id)).all()
        )
    except SQLAlchemyError as error:
        log_database_error("sections.admin_list", error)
        raise _database_unavailable() from None


@router.get("/api/admin/sections/{id}", response_model=SectionResponse)
def get_admin_section(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PortfolioSection:
    try:
        section = db.get(PortfolioSection, id)
    except SQLAlchemyError as error:
        log_database_error("sections.admin_get", error)
        raise _database_unavailable() from None
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.post("/api/admin/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(
    payload: SectionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PortfolioSection:
    section_type = payload.section_type
    key = payload.key or f"custom_{uuid4().hex}"
    _validate_payload(payload, section_type=section_type, key=key)
    if section_type == "built_in" and payload.key is None:
        raise HTTPException(status_code=400, detail="Built-in sections require a key")
    try:
        if _slug_conflict(db, payload.slug):
            raise HTTPException(status_code=409, detail="Section slug already exists")
        if _title_conflict(db, payload.title):
            raise HTTPException(status_code=409, detail="Section title already exists")
        if db.scalar(select(PortfolioSection.id).where(PortfolioSection.key == key)) is not None:
            raise HTTPException(status_code=409, detail="Section key already exists")
        values = payload.model_dump(mode="json", exclude={"key"})
        section = PortfolioSection(key=key, **values)
        db.add(section)
        db.commit()
        db.refresh(section)
        return section
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Section key, title, or slug already exists") from None
    except SQLAlchemyError as error:
        db.rollback()
        log_database_error("sections.create", error)
        raise _database_unavailable() from None


@router.put("/api/admin/sections/{id}", response_model=SectionResponse)
def update_section(
    id: int,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PortfolioSection:
    try:
        section = db.get(PortfolioSection, id)
        if section is None:
            raise HTTPException(status_code=404, detail="Section not found")
        updates = payload.model_dump(mode="json", exclude_unset=True)
        merged = {
            name: getattr(section, name)
            for name in SectionCreate.model_fields
            if name not in {"key", "section_type"}
        }
        merged.update(updates)
        validated = SectionCreate.model_validate(
            {**merged, "key": section.key, "section_type": section.section_type}
        )
        if section.section_type == "built_in" and (
            validated.content_blocks or validated.custom_fields or validated.custom_field_values
        ):
            raise HTTPException(status_code=400, detail="Built-in sections reference existing portfolio content")
        if validated.slug != section.slug and _slug_conflict(db, validated.slug, exclude_id=section.id):
            raise HTTPException(status_code=409, detail="Section slug already exists")
        if validated.title != section.title and _title_conflict(db, validated.title, exclude_id=section.id):
            raise HTTPException(status_code=409, detail="Section title already exists")
        values = validated.model_dump(mode="json", exclude={"key", "section_type"})
        for name, value in values.items():
            setattr(section, name, value)
        db.commit()
        db.refresh(section)
        return section
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Section title or slug already exists") from None
    except SQLAlchemyError as error:
        db.rollback()
        log_database_error("sections.update", error)
        raise _database_unavailable() from None


@router.delete("/api/admin/sections/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        section = db.get(PortfolioSection, id)
        if section is None:
            raise HTTPException(status_code=404, detail="Section not found")
        if section.section_type == "built_in":
            raise HTTPException(status_code=400, detail="Built-in sections cannot be deleted")
        db.delete(section)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        db.rollback()
        log_database_error("sections.delete", error)
        raise _database_unavailable() from None


@router.post("/api/admin/sections/{id}/duplicate", response_model=SectionResponse, status_code=201)
def duplicate_section(
    id: int,
    payload: SectionDuplicateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PortfolioSection:
    try:
        source = db.get(PortfolioSection, id)
        if source is None:
            raise HTTPException(status_code=404, detail="Section not found")
        if _slug_conflict(db, payload.slug):
            raise HTTPException(status_code=409, detail="Section slug already exists")
        if _title_conflict(db, payload.title):
            raise HTTPException(status_code=409, detail="Section title already exists")
        clone = PortfolioSection(
            key=f"custom_{uuid4().hex}",
            slug=payload.slug,
            section_type="custom",
            title=payload.title,
            enabled=False,
            status="draft",
            display_order=source.display_order,
            show_on_homepage=source.show_on_homepage,
            show_on_full_page=source.show_on_full_page,
            short_description=source.short_description,
            long_description=source.long_description,
            read_more_enabled=source.read_more_enabled,
            layout_variant=source.layout_variant,
            cover_image=source.cover_image,
            cover_image_alt=source.cover_image_alt,
            seo_title=source.seo_title,
            meta_description=source.meta_description,
            canonical_slug=None,
            social_image=source.social_image,
            content_blocks=list(source.content_blocks or []),
            custom_fields=list(source.custom_fields or []),
            custom_field_values=dict(source.custom_field_values or {}),
        )
        db.add(clone)
        db.commit()
        db.refresh(clone)
        return clone
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Section title or slug already exists") from None
    except SQLAlchemyError as error:
        db.rollback()
        log_database_error("sections.duplicate", error)
        raise _database_unavailable() from None


@router.put("/api/admin/sections/reorder", response_model=list[SectionResponse])
def reorder_sections(
    payload: SectionReorderRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[PortfolioSection]:
    try:
        sections = list(
            db.scalars(select(PortfolioSection).order_by(PortfolioSection.display_order, PortfolioSection.id)).all()
        )
        if {section.id for section in sections} != set(payload.ids):
            raise HTTPException(status_code=400, detail="Reorder request must include every section exactly once")
        by_id = {section.id: section for section in sections}
        for position, section_id in enumerate(payload.ids):
            by_id[section_id].display_order = position
        db.commit()
        for section in sections:
            db.refresh(section)
        return [by_id[section_id] for section_id in payload.ids]
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        db.rollback()
        log_database_error("sections.reorder", error)
        raise _database_unavailable() from None
