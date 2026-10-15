from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PortfolioSection(Base):
    __tablename__ = "portfolio_sections"
    __table_args__ = (
        UniqueConstraint("section_key", name="uq_portfolio_sections_key"),
        UniqueConstraint("slug", name="uq_portfolio_sections_slug"),
        UniqueConstraint("title", name="uq_portfolio_sections_title"),
        CheckConstraint("section_type IN ('built_in', 'custom')", name="ck_portfolio_sections_type"),
        CheckConstraint("status IN ('draft', 'published', 'archived')", name="ck_portfolio_sections_status"),
        CheckConstraint(
            "layout_variant IN ('standard', 'cards', 'split', 'editorial', 'full_width')",
            name="ck_portfolio_sections_layout",
        ),
        Index("ix_portfolio_sections_home", "status", "enabled", "show_on_homepage", "display_order"),
        Index("ix_portfolio_sections_full", "status", "enabled", "show_on_full_page", "display_order"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column("section_key", String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), nullable=False)
    section_type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft", nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    show_on_homepage: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1", nullable=False)
    show_on_full_page: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1", nullable=False)
    short_description: Mapped[str | None] = mapped_column(String(500))
    long_description: Mapped[str | None] = mapped_column(Text)
    read_more_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)
    layout_variant: Mapped[str] = mapped_column(String(24), default="standard", server_default="standard", nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(2048))
    cover_image_alt: Mapped[str | None] = mapped_column(String(500))
    seo_title: Mapped[str | None] = mapped_column(String(200))
    meta_description: Mapped[str | None] = mapped_column(String(320))
    canonical_slug: Mapped[str | None] = mapped_column(String(150))
    social_image: Mapped[str | None] = mapped_column(String(2048))
    content_blocks: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    custom_fields: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    custom_field_values: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
