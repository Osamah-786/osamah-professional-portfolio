from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.social_link import SocialLink
from app.models.user import User
from app.schemas.social_link import SocialLinkCreate, SocialLinkResponse, SocialLinkUpdate
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


@router.get("/api/social-links", response_model=list[SocialLinkResponse])
def list_social_links(db: Session = Depends(get_db)) -> list[SocialLink]:
    try:
        statement = select(SocialLink).order_by(SocialLink.display_order, SocialLink.id)
        return list(db.scalars(statement).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/social-links/{id}", response_model=SocialLinkResponse)
def get_social_link(id: int, db: Session = Depends(get_db)) -> SocialLink:
    try:
        social_link = db.get(SocialLink, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if social_link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social link not found")
    return social_link


@router.post(
    "/api/admin/social-links",
    response_model=SocialLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_social_link(
    payload: SocialLinkCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> SocialLink:
    try:
        data = payload.model_dump()
        data["url"] = str(data["url"])
        if data["icon"] is not None:
            data["icon"] = str(data["icon"])
        social_link = SocialLink(**data)
        db.add(social_link)
        db.commit()
        db.refresh(social_link)
        return social_link
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/social-links/{id}", response_model=SocialLinkResponse)
def update_social_link(
    id: int,
    payload: SocialLinkUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> SocialLink:
    try:
        social_link = db.get(SocialLink, id)
        if social_link is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social link not found")

        updates = payload.model_dump(exclude_unset=True)
        for field in ("platform", "url", "display_order"):
            if field in updates and updates[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} cannot be null",
                )
        for field in ("url", "icon"):
            if field in updates and updates[field] is not None:
                updates[field] = str(updates[field])

        for field, value in updates.items():
            setattr(social_link, field, value)
        db.commit()
        db.refresh(social_link)
        return social_link
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/social-links/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_link(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        social_link = db.get(SocialLink, id)
        if social_link is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social link not found")
        db.delete(social_link)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
