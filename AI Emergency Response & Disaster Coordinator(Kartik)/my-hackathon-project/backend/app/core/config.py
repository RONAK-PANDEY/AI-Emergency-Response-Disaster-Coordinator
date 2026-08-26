from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Emergency Response Coordinator"
    backend_cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
