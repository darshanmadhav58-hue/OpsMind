from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "OpsMind - Intelligent Incident Response & Memory AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Hindsight Memory Configuration
    HINDSIGHT_BASE_URL: str = "http://localhost:8888"
    HINDSIGHT_API_KEY: str = ""
    HINDSIGHT_BANK_INCIDENTS: str = "opsmind-incidents"
    HINDSIGHT_BANK_SERVICES: str = "opsmind-services"
    HINDSIGHT_BANK_RUNBOOKS: str = "opsmind-runbooks"

    # AI Model Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Operational Database (Rock-solid SQLite for enterprise SRE storage)
    DATABASE_URL: str = "sqlite:///./opsmind.db"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
