from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> str:
    """
    Locate .env by walking up from this file.
    - Inside Docker: /app/.env (WORKDIR is /app, code is at /app/app/...)
    - Local dev:     gowander/.env (repo root)
    Returns the path as a string; pydantic-settings ignores it gracefully
    if the file doesn't exist (Docker uses real env vars instead).
    """
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / ".env"
        if candidate.exists():
            return str(candidate)
    # No .env found — Docker will use env vars injected by docker-compose
    return ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_find_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "GoWander API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str

    GOOGLE_PLACES_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""

    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:19006",
        "http://localhost:8081",
        "exp://localhost:19000",
    ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()