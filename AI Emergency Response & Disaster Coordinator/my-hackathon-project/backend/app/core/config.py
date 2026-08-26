from __future__ import annotations
import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "State Emergency Operations Center (SEOC) - Punjab"
    APP_VERSION: str = "2.4.0-PROD"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./incidents.db"
    OPENAI_API_KEY: Optional[str] = None
    JWT_SECRET: str = "seoc-punjab-disaster-response-secure-key-2026"
    DEMO_MODE: bool = True

settings = Settings()
