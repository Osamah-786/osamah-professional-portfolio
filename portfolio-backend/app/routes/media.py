import logging
from pathlib import PurePath
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.media import Media
from app.models.user import User
from app.schemas.media import MediaCreate, MediaResponse, MediaUpdate
from app.utils.database_logging import log_database_error
from app.utils.dependencies import get_current_admin

router = APIRouter()
logger = logging.getLogger(__name__)

_ALLOWED_FILES = {
    ".jpg": ("image/jpeg", "image", lambda data: data.startswith(b"\xff\xd8\xff")),
    ".jpeg": ("image/jpeg", "image", lambda data: data.startswith(b"\xff\xd8\xff")),
    ".png": ("image/png", "image", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    ".webp": ("image/webp", "image", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    ".pdf": ("application/pdf", "image", lambda data: data.startswith(b"%PDF-")),
}


def _cloudinary_uploader():
    if not (
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key.get_secret_value()
        and settings.cloudinary_api_secret.get_secret_value()
    ):
        raise RuntimeError("Cloudinary is not configured")
    import cloudinary
    from cloudinary import uploader

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key.get_secret_value(),
        api_secret=settings.cloudinary_api_secret.get_secret_value(),
        secure=True,
    )
    return uploader


def _upload_to_cloudinary(content: bytes, resource_type: str) -> dict:
    return _cloudinary_uploader().upload(content, resource_type=resource_type, folder="portfolio")


def _delete_from_cloudinary(public_id: str, resource_type: str) -> str:
    try:
        result = _cloudinary_uploader().destroy(public_id, resource_type=resource_type)
    except Exception as exc:
        if getattr(exc, "http_code", None) == 404 or getattr(exc, "status_code", None) == 404:
            return "not found"
        raise
    return str(result.get("result", "")) if isinstance(result, dict) else ""


def _media_resource_type(file_type: str, file_url: str | None = None) -> str:
    if file_type.startswith("image/") or file_type == "image":
        return "image"

    if file_type == "application/pdf" and file_url:
        path_segments = urlsplit(file_url).path.strip("/").split("/")
        for index, segment in enumerate(path_segments[:-1]):
            if segment in {"image", "raw"} and path_segments[index + 1] in {"upload", "private", "authenticated"}:
                return segment

    return "raw"


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


def _log_upload_failure(stage: str, status_code: int, error: Exception | None = None) -> None:
    error_type = type(error).__name__ if error is not None else "none"
    logger.warning(
        "media_upload stage=%s status=%d error_type=%s",
        stage,
        status_code,
        error_type,
    )


@router.get("/api/media/{id}", response_model=MediaResponse)
def get_media(id: int, db: Session = Depends(get_db)) -> Media:
    try:
        media = db.get(Media, id)
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    return media


@router.get("/api/admin/media", response_model=list[MediaResponse])
def list_media(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[Media]:
    statement = select(Media).order_by(Media.created_at.desc(), Media.id.desc())
    try:
        return list(db.scalars(statement).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.post("/api/admin/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
def create_media(
    payload: MediaCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Media:
    try:
        data = payload.model_dump()
        data["file_url"] = str(data["file_url"])
        media = Media(**data)
        db.add(media)
        db.commit()
        db.refresh(media)
        return media
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.post(
    "/api/admin/media/upload",
    response_model=MediaResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_media(
    file: UploadFile = File(...),
    alt_text: str | None = Form(default=None, max_length=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Media:
    extension = PurePath(file.filename or "").suffix.lower()
    file_spec = _ALLOWED_FILES.get(extension)
    if file_spec is None:
        _log_upload_failure("file_validation", status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=400, detail="Unsupported file type")

    expected_mime, resource_type, signature_check = file_spec
    if (file.content_type or "").lower() != expected_mime:
        _log_upload_failure("file_validation", status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=400, detail="File type does not match its extension")

    max_bytes = settings.media_max_upload_size_mb * 1024 * 1024
    try:
        content = file.file.read(max_bytes + 1)
    except Exception as error:
        _log_upload_failure("file_read", status.HTTP_500_INTERNAL_SERVER_ERROR, error)
        raise HTTPException(status_code=500, detail="Media upload failed") from None
    if not content:
        _log_upload_failure("file_validation", status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=400, detail="File is empty")
    if len(content) > max_bytes:
        _log_upload_failure("file_validation", status.HTTP_413_CONTENT_TOO_LARGE)
        raise HTTPException(status_code=413, detail="File exceeds the configured size limit")
    if not signature_check(content):
        _log_upload_failure("file_validation", status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=400, detail="File content does not match its type")

    try:
        uploaded = _upload_to_cloudinary(content, resource_type)
    except RuntimeError as error:
        _log_upload_failure("cloudinary_configuration", status.HTTP_503_SERVICE_UNAVAILABLE, error)
        raise HTTPException(status_code=503, detail="Media storage is not configured") from None
    except Exception as error:
        _log_upload_failure("cloudinary_upload", status.HTTP_502_BAD_GATEWAY, error)
        raise HTTPException(status_code=502, detail="Media upload failed") from None

    public_id = uploaded.get("public_id") if isinstance(uploaded, dict) else None
    file_url = uploaded.get("secure_url") if isinstance(uploaded, dict) else None
    if not public_id or not file_url or not str(file_url).startswith("https://"):
        _log_upload_failure("cloudinary_response", status.HTTP_502_BAD_GATEWAY)
        if public_id:
            try:
                _delete_from_cloudinary(str(public_id), resource_type)
            except Exception as error:
                _log_upload_failure("cloudinary_cleanup", status.HTTP_502_BAD_GATEWAY, error)
        raise HTTPException(status_code=502, detail="Media upload failed")

    media = Media(
        file_url=str(file_url),
        public_id=str(public_id),
        file_type=expected_mime,
        alt_text=alt_text,
    )
    try:
        db.add(media)
        db.commit()
    except Exception as error:
        _log_upload_failure("database_persistence", status.HTTP_503_SERVICE_UNAVAILABLE, error)
        if isinstance(error, SQLAlchemyError):
            log_database_error("media.upload.persist", error)
        db.rollback()
        try:
            _delete_from_cloudinary(str(public_id), resource_type)
        except Exception as cleanup_error:
            _log_upload_failure("cloudinary_cleanup", status.HTTP_502_BAD_GATEWAY, cleanup_error)
        raise _database_unavailable() from None

    try:
        db.refresh(media)
    except SQLAlchemyError as error:
        _log_upload_failure("database_refresh", status.HTTP_503_SERVICE_UNAVAILABLE, error)
        log_database_error("media.upload.refresh", error)
        db.rollback()
        raise _database_unavailable() from None
    return media


@router.put("/api/admin/media/{id}", response_model=MediaResponse)
def update_media(
    id: int,
    payload: MediaUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Media:
    try:
        media = db.get(Media, id)
        if media is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

        updates = payload.model_dump(exclude_unset=True)
        for field in ("file_url", "file_type"):
            if field in updates and updates[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} cannot be null",
                )
        if "file_url" in updates:
            updates["file_url"] = str(updates["file_url"])

        for field, value in updates.items():
            setattr(media, field, value)
        db.commit()
        db.refresh(media)
        return media
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/media/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        media = db.get(Media, id)
        if media is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
        if media.public_id:
            resource_type = _media_resource_type(media.file_type, media.file_url)
            try:
                result = _delete_from_cloudinary(media.public_id, resource_type)
            except RuntimeError:
                raise HTTPException(status_code=503, detail="Media storage is not configured") from None
            except Exception:
                raise HTTPException(status_code=502, detail="Media storage deletion failed") from None
            if result not in {"ok", "not found"}:
                raise HTTPException(status_code=502, detail="Media storage deletion failed")
        db.delete(media)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
