from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


AnalysisStatus = Literal["queued", "running", "completed", "partial", "failed", "cancelled"]


class AnalysisRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    website: str | None = Field(default=None, max_length=2048)
    product_description: str = Field(min_length=1, max_length=5000)
    target_market: str = Field(min_length=1, max_length=200)
    target_industry: str = Field(min_length=1, max_length=200)
    ideal_customer: str = Field(min_length=1, max_length=1000)
    business_goal: str = Field(min_length=1, max_length=2000)
    required_capabilities: list[str] = Field(default_factory=list, max_length=20)
    partner_types: list[str] = Field(default_factory=list, max_length=20)
    max_candidates: int = Field(default=20, ge=1, le=50)
    max_partners: int = Field(default=3, ge=1, le=6)

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str | None) -> str | None:
        if value and not value.startswith(("https://", "http://")):
            raise ValueError("website must start with http:// or https://")
        return value

    @field_validator("required_capabilities", "partner_types")
    @classmethod
    def strip_values(cls, values: list[str]) -> list[str]:
        return [value.strip() for value in values if value.strip()]


class ErrorResponse(BaseModel):
    error: dict[str, Any]


class AnalysisAccepted(BaseModel):
    analysis_id: str
    status: AnalysisStatus


class AnalysisStatusResponse(BaseModel):
    analysis_id: str
    status: AnalysisStatus
    stage: str
    progress: int = Field(ge=0, le=100)
    created_at: datetime
    updated_at: datetime
    warnings: list[dict[str, Any]] = Field(default_factory=list)
    errors: list[dict[str, Any]] = Field(default_factory=list)
    report: dict[str, Any] | None = None
