from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ProfileCreate(BaseModel):
    name: NonEmptyStr
    headline: str | None = None
    short_bio: str | None = None
    full_bio: str | None = None
    profile_image: HttpUrl | None = None
    location: str | None = None
    email: str | None = None
    resume_url: HttpUrl | None = None


class ProfileUpdate(BaseModel):
    name: NonEmptyStr | None = None
    headline: str | None = None
    short_bio: str | None = None
    full_bio: str | None = None
    profile_image: HttpUrl | None = None
    location: str | None = None
    email: str | None = None
    resume_url: HttpUrl | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    headline: str | None
    short_bio: str | None
    full_bio: str | None
    profile_image: HttpUrl | None
    location: str | None
    email: str | None
    resume_url: HttpUrl | None
    created_at: datetime
    updated_at: datetime
