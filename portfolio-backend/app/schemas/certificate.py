from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, HttpUrl, StringConstraints


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class CertificateCreate(BaseModel):
    title: NonEmptyStr
    issuer: str | None = None
    issue_date: date | None = None
    credential_url: HttpUrl | None = None
    certificate_image: HttpUrl | None = None
    certificate_file: HttpUrl | None = None
    description: str | None = None
    featured: bool = False
    display_order: int = 0


class CertificateUpdate(BaseModel):
    title: NonEmptyStr | None = None
    issuer: str | None = None
    issue_date: date | None = None
    credential_url: HttpUrl | None = None
    certificate_image: HttpUrl | None = None
    certificate_file: HttpUrl | None = None
    description: str | None = None
    featured: bool | None = None
    display_order: int | None = None


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    issuer: str | None
    issue_date: date | None
    credential_url: HttpUrl | None
    certificate_image: HttpUrl | None
    certificate_file: HttpUrl | None
    description: str | None
    featured: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
