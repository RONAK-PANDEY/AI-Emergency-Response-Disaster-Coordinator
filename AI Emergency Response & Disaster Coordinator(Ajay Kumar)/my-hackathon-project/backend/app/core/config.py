"""
Application configuration settings
"""

import os
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API
    API_TITLE: str = "Emergency Response Coordinator API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered emergency response and disaster coordination system"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./incidents.db")
    SQLALCHEMY_ECHO: bool = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4o"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]
    
    # Upload
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
