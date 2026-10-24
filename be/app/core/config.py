from pydantic_settings import BaseSettings
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Lebupara Thunder Club API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./lebupara.db"

    # JWT
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Rate limiting
    RATE_LIMIT_LOGIN: str = "5/minute"

    # League config
    LEAGUE_NAME: str = "Lebupara Thunder Club League"
    TOTAL_MATCHES: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
