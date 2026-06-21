from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "BNI Cricket + CricPro"
    APP_VERSION: str = "2.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change_this_to_a_very_long_random_secret_key_min_32_chars"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgre123@localhost:5432/bni_cricket"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgre123@localhost:5432/bni_cricket"
    POSTGRES_SCHEMA: str = "bni"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # MinIO (BNI media uploads)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_IMAGES: str = "bni-images"
    MINIO_BUCKET_VIDEOS: str = "bni-videos"
    MINIO_USE_SSL: bool = False
    MINIO_PUBLIC_URL: str = "http://localhost:9000"

    # Redis (CricPro WebSocket pub/sub — optional)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Local media (CricPro player photos + general uploads)
    MEDIA_ROOT: str = "./media"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Admin seed
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "Admin@1234"
    ADMIN_EMAIL: str = "admin@bnicricket.com"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # CricPro alias
    @property
    def allowed_origins_list(self) -> List[str]:
        return self.cors_origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
