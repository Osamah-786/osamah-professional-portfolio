from datetime import date, datetime
import math
import json
import re
from typing import Any, Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, field_validator, model_validator
from typing import Annotated


NonEmpty = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Slug = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=1, max_length=150)]
Key = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(?:[_-][a-z0-9]+)*$", min_length=1, max_length=100)]

SectionType = Literal["built_in", "custom"]
SectionStatus = Literal["draft", "published", "archived"]
LayoutVariant = Literal["standard", "cards", "split", "editorial", "full_width"]
FieldType = Literal["text", "textarea", "rich_text", "url", "date", "number", "tags", "image", "file", "links"]
BlockType = Literal["heading", "paragraph", "list", "image", "gallery", "links", "quote", "callout"]


class SectionLink(BaseModel):
    label: NonEmpty = Field(max_length=120)
    url: HttpUrl


class SectionImage(BaseModel):
    url: HttpUrl
    alt_text: NonEmpty = Field(max_length=500)
    caption: str | None = Field(default=None, max_length=500)


class SectionBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: BlockType
    title: str | None = Field(default=None, max_length=200)
    text: str | None = Field(default=None, max_length=10000)
    items: list[NonEmpty] | None = Field(default=None, max_length=100)
    url: HttpUrl | None = None
    alt_text: str | None = Field(default=None, max_length=500)
    images: list[SectionImage] | None = Field(default=None, max_length=20)
    links: list[SectionLink] | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def validate_block_content(self):
        if self.type == "heading" and not self.title:
            raise ValueError("heading blocks require a title")
        if self.type in {"paragraph", "quote", "callout"} and not self.text:
            raise ValueError(f"{self.type} blocks require text")
        if self.type == "list" and not self.items:
            raise ValueError("list blocks require at least one item")
        if self.type == "image" and (self.url is None or not self.alt_text):
            raise ValueError("image blocks require a URL and alt text")
        if self.type == "gallery" and not self.images:
            raise ValueError("gallery blocks require at least one image")
        if self.type == "links" and not self.links:
            raise ValueError("links blocks require at least one link")
        return self


class CustomFieldDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Key
    label: NonEmpty = Field(max_length=120)
    type: FieldType
    required: bool = False
    options: list[NonEmpty] = Field(default_factory=list, max_length=30)


class SectionBase(BaseModel):
    slug: Slug
    title: NonEmpty = Field(max_length=150)
    enabled: bool = True
    status: SectionStatus = "draft"
    display_order: int = Field(default=0, ge=0, le=100000)
    show_on_homepage: bool = True
    show_on_full_page: bool = True
    short_description: str | None = Field(default=None, max_length=500)
    long_description: str | None = Field(default=None, max_length=10000)
    read_more_enabled: bool = False
    layout_variant: LayoutVariant = "standard"
    cover_image: HttpUrl | None = None
    cover_image_alt: str | None = Field(default=None, max_length=500)
    seo_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=320)
    canonical_slug: Slug | None = None
    social_image: HttpUrl | None = None
    content_blocks: list[SectionBlock] = Field(default_factory=list, max_length=100)
    custom_fields: list[CustomFieldDefinition] = Field(default_factory=list, max_length=30)
    custom_field_values: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_custom_fields(self):
        names = [field.name for field in self.custom_fields]
        if len(names) != len(set(names)):
            raise ValueError("custom field names must be unique")
        values = self.custom_field_values
        known = set(names)
        if set(values) - known:
            raise ValueError("custom field values must match configured fields")
        for field in self.custom_fields:
            value = values.get(field.name)
            if value is None:
                if field.required:
                    raise ValueError(f"{field.label} is required")
                continue
            if field.type in {"text", "textarea", "rich_text"}:
                if not isinstance(value, str) or len(value) > 10000:
                    raise ValueError(f"{field.label} must be text of at most 10000 characters")
            elif field.type in {"url", "image", "file"}:
                if not isinstance(value, str):
                    raise ValueError(f"{field.label} must be a URL")
                parsed = urlsplit(value)
                if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                    raise ValueError(f"{field.label} must use HTTP or HTTPS")
            elif field.type == "date":
                if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                    raise ValueError(f"{field.label} must use YYYY-MM-DD")
                try:
                    date.fromisoformat(value)
                except ValueError:
                    raise ValueError(f"{field.label} must be a valid date") from None
            elif field.type == "number":
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                    raise ValueError(f"{field.label} must be a finite number")
            elif field.type == "tags":
                if not isinstance(value, list) or len(value) > 50 or any(
                    not isinstance(tag, str) or not tag.strip() or len(tag) > 120 for tag in value
                ):
                    raise ValueError(f"{field.label} must be a list of up to 50 non-empty tags")
            elif field.type == "links":
                if not isinstance(value, list) or len(value) > 50:
                    raise ValueError(f"{field.label} must contain up to 50 links")
                for item in value:
                    link = SectionLink.model_validate(item)
                    if link.url.scheme not in {"http", "https"}:
                        raise ValueError(f"{field.label} links must use HTTP or HTTPS")
        try:
            encoded = json.dumps(
                {
                    "blocks": [block.model_dump(mode="json") for block in self.content_blocks],
                    "definitions": [field.model_dump(mode="json") for field in self.custom_fields],
                    "fields": values,
                    "long_description": self.long_description,
                },
                ensure_ascii=False,
            )
        except (TypeError, ValueError):
            raise ValueError("section content must be JSON-compatible") from None
        if len(encoded.encode("utf-8")) > 100_000:
            raise ValueError("section content must be no larger than 100 KB")
        def nesting(value: Any) -> int:
            if isinstance(value, dict):
                return 1 + max((nesting(child) for child in value.values()), default=0)
            if isinstance(value, list):
                return 1 + max((nesting(child) for child in value), default=0)
            return 0
        if nesting(values) > 5:
            raise ValueError("custom field data cannot be nested more than five levels")
        return self

    @model_validator(mode="after")
    def validate_cover_alt(self):
        if self.cover_image and not self.cover_image_alt:
            raise ValueError("cover_image_alt is required when cover_image is set")
        return self


class SectionCreate(SectionBase):
    section_type: SectionType = "custom"
    key: Key | None = None

    @model_validator(mode="after")
    def validate_custom_read_more(self):
        if self.section_type == "custom" and self.read_more_enabled and not (self.long_description or self.content_blocks):
            raise ValueError("custom Read More pages require long description or content blocks")
        return self


class SectionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: Slug | None = None
    title: NonEmpty | None = Field(default=None, max_length=150)
    enabled: bool | None = None
    status: SectionStatus | None = None
    display_order: int | None = Field(default=None, ge=0, le=100000)
    show_on_homepage: bool | None = None
    show_on_full_page: bool | None = None
    short_description: str | None = Field(default=None, max_length=500)
    long_description: str | None = Field(default=None, max_length=10000)
    read_more_enabled: bool | None = None
    layout_variant: LayoutVariant | None = None
    cover_image: HttpUrl | None = None
    cover_image_alt: str | None = Field(default=None, max_length=500)
    seo_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=320)
    canonical_slug: Slug | None = None
    social_image: HttpUrl | None = None
    content_blocks: list[SectionBlock] | None = Field(default=None, max_length=100)
    custom_fields: list[CustomFieldDefinition] | None = Field(default=None, max_length=30)
    custom_field_values: dict[str, Any] | None = None


class SectionDuplicateRequest(BaseModel):
    title: NonEmpty = Field(max_length=150)
    slug: Slug


class SectionReorderRequest(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=500)

    @field_validator("ids")
    @classmethod
    def unique_ids(cls, values: list[int]) -> list[int]:
        if len(values) != len(set(values)):
            raise ValueError("section IDs must not be repeated")
        return values


class SectionResponse(SectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    section_type: SectionType
    created_at: datetime
    updated_at: datetime


class PublicSectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    slug: str
    section_type: SectionType
    title: str
    display_order: int
    show_on_homepage: bool
    show_on_full_page: bool
    short_description: str | None
    long_description: str | None
    read_more_enabled: bool
    layout_variant: LayoutVariant
    cover_image: HttpUrl | None
    cover_image_alt: str | None
    seo_title: str | None
    meta_description: str | None
    canonical_slug: str | None
    social_image: HttpUrl | None
    content_blocks: list[SectionBlock]
    custom_fields: list[CustomFieldDefinition]
    custom_field_values: dict[str, Any]
    created_at: datetime
    updated_at: datetime
