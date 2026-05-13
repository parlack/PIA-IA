from fastapi import APIRouter, Depends
from core.database import get_db
from models import UsuarioUpdate
from services import usuario_service, vacuna_service

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/{curp}")
def get_usuario(curp: str, db = Depends(get_db)):
    return usuario_service.obtener_usuario(db, curp)


@router.patch("/{curp}")
def update_usuario(curp: str, data: UsuarioUpdate, db = Depends(get_db)):
    usuario_service.actualizar_usuario(db, curp, data.dict())
    return {"ok": True}


@router.get("/{curp}/vacunas")
def get_historial(curp: str, db = Depends(get_db)):
    return vacuna_service.obtener_historial(db, curp)
