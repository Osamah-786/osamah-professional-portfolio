from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.utils.dependencies import get_current_admin

router = APIRouter()


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database unavailable",
    )


@router.get("/api/projects", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)) -> list[Project]:
    try:
        return list(db.scalars(select(Project).order_by(Project.display_order, Project.id)).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/projects/featured", response_model=list[ProjectResponse])
def list_featured_projects(db: Session = Depends(get_db)) -> list[Project]:
    statement = (
        select(Project)
        .where(Project.featured.is_(True))
        .order_by(Project.display_order, Project.id)
    )
    try:
        return list(db.scalars(statement).all())
    except SQLAlchemyError:
        raise _database_unavailable() from None


@router.get("/api/projects/{slug}", response_model=ProjectResponse)
def get_project_by_slug(slug: str, db: Session = Depends(get_db)) -> Project:
    try:
        project = db.scalar(select(Project).where(Project.slug == slug))
    except SQLAlchemyError:
        raise _database_unavailable() from None
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post(
    "/api/admin/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Project:
    try:
        existing = db.scalar(select(Project.id).where(Project.slug == payload.slug))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug already exists")

        project = Project(**payload.model_dump(mode="json"))
        db.add(project)
        db.commit()
        db.refresh(project)
        return project
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug already exists") from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.put("/api/admin/projects/{id}", response_model=ProjectResponse)
def update_project(
    id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Project:
    try:
        project = db.get(Project, id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        updates = payload.model_dump(mode="json", exclude_unset=True)
        for field in ("title", "slug"):
            if field in updates and updates[field] is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"{field} cannot be null")

        new_slug = updates.get("slug")
        if new_slug is not None and new_slug != project.slug:
            existing = db.scalar(
                select(Project.id).where(Project.slug == new_slug, Project.id != project.id)
            )
            if existing is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug already exists")

        for field, value in updates.items():
            setattr(project, field, value)
        db.commit()
        db.refresh(project)
        return project
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug already exists") from None
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None


@router.delete("/api/admin/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    try:
        project = db.get(Project, id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        db.delete(project)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise _database_unavailable() from None
