from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.certificate import Certificate
from app.models.user import User
from app.schemas.certificate import CertificateCreate, CertificateResponse, CertificateUpdate
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


@router.get("/api/certificates", response_model=list[CertificateResponse])
def list_certificates(db: Session = Depends(get_db)) -> list[Certificate]:
    try:
        return list(db.scalars(select(Certificate).order_by(Certificate.display_order, Certificate.id)).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/certificates/featured", response_model=list[CertificateResponse])
def list_featured_certificates(db: Session = Depends(get_db)) -> list[Certificate]:
    statement = (
        select(Certificate)
        .where(Certificate.featured.is_(True))
        .order_by(Certificate.display_order, Certificate.id)
    )
    try:
        return list(db.scalars(statement).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/certificates/{id}", response_model=CertificateResponse)
def get_certificate(id: int, db: Session = Depends(get_db)) -> Certificate:
    try:
        certificate = db.get(Certificate, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if certificate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    return certificate


@router.post(
    "/api/admin/certificates",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_certificate(
    payload: CertificateCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Certificate:
    try:
        data = payload.model_dump()
        for field in ("credential_url", "certificate_image", "certificate_file"):
            if data[field] is not None:
                data[field] = str(data[field])
        certificate = Certificate(**data)
        db.add(certificate)
        db.commit()
        db.refresh(certificate)
        return certificate
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/certificates/{id}", response_model=CertificateResponse)
def update_certificate(
    id: int,
    payload: CertificateUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Certificate:
    try:
        certificate = db.get(Certificate, id)
        if certificate is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

        updates = payload.model_dump(exclude_unset=True)
        if "title" in updates and updates["title"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="title cannot be null",
            )
        for field in ("credential_url", "certificate_image", "certificate_file"):
            if field in updates and updates[field] is not None:
                updates[field] = str(updates[field])

        for field, value in updates.items():
            setattr(certificate, field, value)
        db.commit()
        db.refresh(certificate)
        return certificate
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/certificates/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        certificate = db.get(Certificate, id)
        if certificate is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
        db.delete(certificate)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
