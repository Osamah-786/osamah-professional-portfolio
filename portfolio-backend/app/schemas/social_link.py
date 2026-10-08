from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, HttpUrl, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class SocialLinkCreate(BaseModel):
    platform: NonEmptyStr
    url: HttpUrl
    icon: HttpUrl | None = None
    display_order: int = 0


class SocialLinkUpdate(BaseModel):
    platform: NonEmptyStr | None = None
    url: HttpUrl | None = None
    icon: HttpUrl | None = None
    display_order: int | None = None


class SocialLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    platform: str
    url: HttpUrl
    icon: HttpUrl | None
    display_order: int
    created_at: datetime
    updated_at: datetime
