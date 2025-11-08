"""
應用程式配置管理
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    """應用程式設定"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    # 基本設定
    PROJECT_NAME: str = "Calendar App API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # 資料庫
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # JWT 認證
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:19006"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """解析 CORS origins（支援 JSON 字串或列表）"""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    # 檔案上傳
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_FILE_TYPES: str = "image/jpeg,image/png,image/gif,application/pdf,text/plain"

    @property
    def max_upload_size_bytes(self) -> int:
        """上傳大小限制（bytes）"""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def allowed_file_types_list(self) -> List[str]:
        """允許的檔案類型列表"""
        return [ft.strip() for ft in self.ALLOWED_FILE_TYPES.split(",")]

    # WebSocket
    WEBSOCKET_PING_INTERVAL: int = 30
    WEBSOCKET_TIMEOUT: int = 300

    # 安全設定
    MIN_PASSWORD_LENGTH: int = 8
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    RATE_LIMIT_PER_MINUTE: int = 60

    # 日誌
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # 功能開關
    ENABLE_REGISTRATION: bool = True
    ENABLE_EMAIL_VERIFICATION: bool = False
    ENABLE_SOCIAL_LOGIN: bool = False
    ENABLE_FILE_UPLOAD: bool = True

    # API 文檔
    ENABLE_DOCS: bool = True
    DOCS_URL: str = "/api/docs"
    REDOC_URL: str = "/api/redoc"

    # 時區
    DEFAULT_TIMEZONE: str = "Asia/Taipei"
    DEFAULT_LANGUAGE: str = "zh-TW"


# 建立全域設定實例
settings = Settings()
