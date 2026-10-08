from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ProjectCreate(BaseModel):
    title: NonEmptyStr
    slug: NonEmptyStr
    short_description: str | None = None
    description: str | None = None
    cover_image: HttpUrl | None = None
    github_url: HttpUrl | None = None
    live_url: HttpUrl | None = None
    featured: bool = False
    display_order: int = 0


class ProjectUpdate(BaseModel):
    title: NonEmptyStr | None = None
    slug: NonEmptyStr | None = None
    short_description: str | None = None
    description: str | None = None
    cover_image: HttpUrl | None = None
    github_url: HttpUrl | None = None
    live_url: HttpUrl | None = None
    featured: bool | None = None
    display_order: int | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    short_description: str | None
    description: str | None
    cover_image: HttpUrl | None
    github_url: HttpUrl | None
    live_url: HttpUrl | None
    featured: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
