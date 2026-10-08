from datetime import date as Date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, HttpUrl, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class AchievementCreate(BaseModel):
    title: NonEmptyStr
    short_description: str | None = None
    description: str | None = None
    image: HttpUrl | None = None
    link: HttpUrl | None = None
    date: Date | None = None
    featured: bool = False
    display_order: int = 0


class AchievementUpdate(BaseModel):
    title: NonEmptyStr | None = None
    short_description: str | None = None
    description: str | None = None
    image: HttpUrl | None = None
    link: HttpUrl | None = None
    date: Date | None = None
    featured: bool | None = None
    display_order: int | None = None


class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    short_description: str | None
    description: str | None
    image: HttpUrl | None
    link: HttpUrl | None
    date: Date | None
    featured: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
