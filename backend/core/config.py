"""Carga de configuracion desde variables de entorno (.env)."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


class Settings:
    APP_NAME: str = "Cartilla de Vacunacion Digital PIA-IA"
    APP_VERSION: str = "3.0.0"

    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "vacunas")

    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:8081,http://localhost:19006"
        ).split(",") if o.strip()
    ]


settings = Settings()
