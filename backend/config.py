from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "GravityQA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./gravityqa.db"
    
    # Appium
    APPIUM_HOST: str = "localhost"
    APPIUM_PORT: int = 4723
    
    # Playwright
    PLAYWRIGHT_PORT: int = 9323
    
    # AI Settings
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "openai"  # openai, anthropic, local
    DEFAULT_MODEL: str = "gpt-4-vision-preview"
    
    # Vector DB
    CHROMA_PERSIST_DIR: str = "./vector_db"
    
    # File Storage
    DATA_DIR: Path = Path.home() / "Library" / "Application Support" / "GravityQA"
    PROJECTS_DIR: Path = DATA_DIR / "projects"
    
    # WebSocket
    WS_MESSAGE_QUEUE_SIZE: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
