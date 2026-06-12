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

    # SerpAPI key for live Google Flights results. Empty = offline estimates.
    SERPAPI_KEY: str = ""

    # OAuth client IDs accepted as `aud` on Google ID tokens (comma-separated:
    # web, iOS and Android client IDs). Empty = Google sign-in disabled.
    GOOGLE_OAUTH_CLIENT_IDS: str = ""
    # Web client secret — required for the server-side OAuth flow (Expo Go)
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    # Public https base URL of this API (e.g. an ngrok tunnel in dev).
    # Google redirects the OAuth callback here, so it must be reachable
    # from the phone's browser and registered in the Google Console.
    PUBLIC_BASE_URL: str = ""

    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:19006",
        "http://localhost:8081",
        "exp://localhost:19000",
    ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def google_client_ids(self) -> list[str]:
        return [s.strip() for s in self.GOOGLE_OAUTH_CLIENT_IDS.split(",") if s.strip()]

    @property
    def google_web_client_id(self) -> str:
        """The web client drives the server-side flow; it's listed first."""
        ids = self.google_client_ids
        return ids[0] if ids else ""

    @property
    def uploads_dir(self) -> Path:
        # apps/backend/uploads — served at /static
        return Path(__file__).resolve().parents[2] / "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()