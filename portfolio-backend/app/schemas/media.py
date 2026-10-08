from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl


class MediaCreate(BaseModel):
    file_url: HttpUrl
    public_id: str | None = None
    file_type: str
    alt_text: str | None = None


class MediaUpdate(BaseModel):
    file_url: HttpUrl | None = None
    public_id: str | None = None
    file_type: str | None = None
    alt_text: str | None = None


class MediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_url: HttpUrl
    public_id: str | None
    file_type: str
    alt_text: str | None
    created_at: datetime
    updated_at: datetime
