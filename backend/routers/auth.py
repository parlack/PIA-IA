from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from core.database import get_db
from core.rate_limit import limiter
from models import LoginRequest, SetPasswordRequest
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class AceptarTerminosRequest(BaseModel):
    curp: str


@router.post(
    "/login",
    summary="Login dual (rapido o completo)",
    description=(
        "Si no envias `contrasena` regresa el modo de consulta rapida. "
        "Si la envias, valida con bcrypt y registra `ultimo_acceso`. "
        "Limite: 10 requests/minuto por IP."
    ),
    responses={
        200: {
            "description": "Sesion autenticada",
            "content": {"application/json": {"example": {
                "autenticado":      True,
                "curp":             "GUMA950715MNLTRR02",
                "nombre":           "Maria",
                "apellido_paterno": "Gutierrez",
                "correo":           "maria.gutierrez@gmail.com",
                "rol":              "usuario",
                "acepto_terminos":  True,
            }}},
        },
        401: {"description": "Contrasena incorrecta."},
        404: {"description": "CURP no registrada (login modo consulta rapida)."},
        429: {"description": "Demasiados intentos. Espera un minuto."},
    },
)
@limiter.limit("10/minute")
def login(req: LoginRequest, request: Request, db = Depends(get_db)):
    return auth_service.autenticar_usuario(db, req.curp, req.contrasena, request)


@router.post(
    "/set-password",
    summary="Crear o actualizar contrasena (hash bcrypt)",
    description=(
        "Asigna una contrasena usando bcrypt (costo 12). "
        "Si el ciudadano ya tenia contrasena, la reemplaza. "
        "Limite: 5 requests/minuto por IP."
    ),
)
@limiter.limit("5/minute")
def set_password(req: SetPasswordRequest, request: Request, db = Depends(get_db)):
    auth_service.actualizar_password(db, req.curp, req.contrasena, request)
    return {"ok": True, "mensaje": "Contrasena actualizada correctamente."}


@router.post(
    "/aceptar-terminos",
    summary="Aceptar consentimiento informado y politica de privacidad",
    description="Marca `acepto_terminos=1` y registra `fecha_aceptacion_terminos`.",
)
def aceptar_terminos(req: AceptarTerminosRequest, request: Request, db = Depends(get_db)):
    auth_service.aceptar_terminos(db, req.curp, request)
    return {"ok": True}
