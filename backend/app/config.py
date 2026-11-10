from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "KIRANAMITRA AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Gnani AI API Credentials
    # Read from environment or .env
    GNANI_API_KEY: str = os.getenv("GNANI_API_KEY", "")
    GNANI_BASE_URL: str = os.getenv("GNANI_BASE_URL", "https://api.vachana.ai")
    GNANI_PRISMA_ENDPOINT: str = os.getenv("GNANI_PRISMA_ENDPOINT", "https://api.vachana.ai/stt/v3")
    GNANI_TIMBRE_ENDPOINT: str = os.getenv("GNANI_TIMBRE_ENDPOINT", "https://api.vachana.ai/api/v1/tts/inference")
    
    # Gnani Evon LLM / Reasoning Endpoint (OpenAI compatible or local vLLM/SGLang)
    GNANI_EVON_BASE_URL: str = os.getenv("GNANI_EVON_BASE_URL", "http://localhost:8000/v1")
    GNANI_EVON_API_KEY: str = os.getenv("GNANI_EVON_API_KEY", "")
    GNANI_EVON_MODEL: str = os.getenv("GNANI_EVON_MODEL", "gnani/gnani-evon-v3.3-30B-A3B")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kiranamitra.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*"
    ]

settings = Settings()
