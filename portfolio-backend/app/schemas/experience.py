from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, HttpUrl, StringConstraints, model_validator


NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ExperienceCreate(BaseModel):
    company: NonEmptyStr
    role: NonEmptyStr
    company_logo: HttpUrl | None = None
    location: str | None = None
    start_date: date
    end_date: date | None = None
    currently_working: bool = False
    short_description: str | None = None
    description: str | None = None
    featured: bool = False
    display_order: int = 0

    @model_validator(mode="after")
    def validate_dates(self) -> "ExperienceCreate":
        if self.currently_working:
            if self.end_date is not None:
                raise ValueError("end_date must be null for a current experience")
        elif self.end_date is None:
            raise ValueError("end_date is required when currently_working is false")

        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class ExperienceUpdate(BaseModel):
    company: NonEmptyStr | None = None
    role: NonEmptyStr | None = None
    company_logo: HttpUrl | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    currently_working: bool | None = None
    short_description: str | None = None
    description: str | None = None
    featured: bool | None = None
    display_order: int | None = None


class ExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    company_logo: HttpUrl | None
    location: str | None
    start_date: date | None
    end_date: date | None
    currently_working: bool
    short_description: str | None
    description: str | None
    featured: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
