"""Punto de entrada FastAPI - app delgada, solo monta routers y middleware."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.config import settings
from core.rate_limit import limiter
from routers import (
    health, auth, usuarios, vacunas, mensajes, admin, alertas, unidades,
    certificados, alergias, aefi, cuidadores, citas, auditoria, reportes,
    push,
)

API_DESCRIPTION = """
**PIA-IA** es el sistema unificado de cartilla de vacunacion digital para Mexico.
La API expone los recursos consumidos por la app web (Nuxt 4) y la app movil
(Expo + React Native).

### Convenciones
- Identidad del ciudadano: CURP (18 caracteres, mayusculas).
- Fechas: ISO-8601 (`YYYY-MM-DD` y `YYYY-MM-DD HH:MM:SS`).
- Errores: cuerpo `{"detail": "..."}` con codigos HTTP estandar.

### Autenticacion
- Login dual: rapido (solo CURP, modo consulta) o completo (CURP + contrasena bcrypt).
- Rate limiting (slowapi) en `/auth/login` y `/auth/set-password`.

### Modulos principales
1. **auth** – sesion, contrasenas, consentimiento.
2. **usuarios / vacunas / alertas** – cartilla digital del ciudadano.
3. **certificados** – PDF + QR personal verificable.
4. **alergias / aefi / cuidadores / citas** – seguridad clinica.
5. **reportes / push** – panel administrativo y notificaciones.
6. **auditoria** – bitacora de accesos.
""".strip()

OPENAPI_TAGS = [
    {"name": "health",       "description": "Verificacion de estado de la API y la base de datos."},
    {"name": "auth",         "description": "Login, contrasenas, consentimiento informado."},
    {"name": "usuarios",     "description": "Perfil del ciudadano e historial personal."},
    {"name": "vacunas",      "description": "Catalogo nacional + registro de dosis aplicadas."},
    {"name": "alertas",      "description": "Calculo de vacunas pendientes por usuario."},
    {"name": "buzon",        "description": "Mensajeria interna admin -> ciudadano."},
    {"name": "admin",        "description": "Gestion ciudadanos, catalogo y estadisticas."},
    {"name": "unidades",     "description": "Unidades medicas (UMF y hospitales)."},
    {"name": "certificados", "description": "Cartilla en PDF y QR personal verificable."},
    {"name": "alergias",     "description": "Alergias y contraindicaciones del ciudadano."},
    {"name": "aefi",         "description": "Reporte de eventos adversos post-vacunacion."},
    {"name": "cuidadores",   "description": "Relaciones cuidador-dependiente."},
    {"name": "citas",        "description": "Agendamiento de citas de vacunacion."},
    {"name": "auditoria",    "description": "Bitacora de accesos y eventos sensibles."},
    {"name": "reportes",     "description": "Cobertura geografica, por vacuna y por grupo."},
    {"name": "push",         "description": "Notificaciones push (Expo) y correo (Yolani Mail)."},
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=API_DESCRIPTION,
    openapi_tags=OPENAPI_TAGS,
    contact={
        "name":  "Equipo PIA-IA",
        "email": "soporte@pia-ia.mx",
    },
    license_info={
        "name": "Uso interno (entregable academico)",
    },
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
app.include_router(certificados.router)
app.include_router(alergias.router)
app.include_router(aefi.router)
app.include_router(cuidadores.router)
app.include_router(citas.router)
app.include_router(auditoria.router)
app.include_router(reportes.router)
app.include_router(push.router)
