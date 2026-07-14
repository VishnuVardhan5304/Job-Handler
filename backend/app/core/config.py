from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 5000
    database_url: str
    client_url: str = "http://localhost:5173"
    environment: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.client_url.split(",") if origin.strip()]
        if self.environment == "development":
            origins.extend(
                [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            )
        return list(dict.fromkeys(origins))


settings = Settings()
