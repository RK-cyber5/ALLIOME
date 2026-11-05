from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Secrets remain server-side and are never serialized."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", populate_by_name=True)

    crustdata_api_key: str | None = Field(default=None, validation_alias="CRUSTDATA_API_KEY")
    database_url: str = Field(default="sqlite:///./partnerpilot.db", validation_alias="DATABASE_URL")
    cors_origins: str = Field(default="", validation_alias="CORS_ORIGINS")
    demo_mode: bool = Field(default=False, validation_alias="DEMO_MODE")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    request_timeout_seconds: float = 20.0
    max_concurrent_requests: int = 3
    max_investigated_companies: int = 8

    @property
    def database_path(self) -> Path:
        prefix = "sqlite:///"
        if not self.database_url.startswith(prefix):
            raise ValueError("Only sqlite DATABASE_URL values are supported for the hackathon backend")
        return Path(self.database_url.removeprefix(prefix)).resolve()

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
