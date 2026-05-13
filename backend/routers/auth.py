from fastapi import APIRouter, Depends
from core.database import get_db
from models import LoginRequest, SetPasswordRequest
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(req: LoginRequest, db = Depends(get_db)):
    return auth_service.autenticar_usuario(db, req.curp, req.contrasena)


@router.post("/set-password")
def set_password(req: SetPasswordRequest, db = Depends(get_db)):
    auth_service.actualizar_password(db, req.curp, req.contrasena)
    return {"ok": True, "mensaje": "Contrasena actualizada correctamente."}
