from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, HttpUrl, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class SkillCategoryCreate(BaseModel):
    name: NonEmptyStr
    display_order: int = 0


class SkillCategoryUpdate(BaseModel):
    name: NonEmptyStr | None = None
    display_order: int | None = None


class SkillCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    display_order: int


class SkillCreate(BaseModel):
    name: NonEmptyStr
    category_id: int
    icon: HttpUrl | None = None
    display_order: int = 0


class SkillUpdate(BaseModel):
    name: NonEmptyStr | None = None
    category_id: int | None = None
    icon: HttpUrl | None = None
    display_order: int | None = None


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category_id: int
    icon: HttpUrl | None
    display_order: int
    created_at: datetime
    updated_at: datetime
