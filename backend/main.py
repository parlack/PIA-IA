"""Punto de entrada FastAPI - app delgada, solo monta routers y middleware."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import health, auth, usuarios, vacunas, mensajes, admin, alertas, unidades

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(vacunas.router)
app.include_router(mensajes.router)
app.include_router(admin.router)
app.include_router(alertas.router)
app.include_router(unidades.router)
